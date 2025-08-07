-- Billing and reconciliation system

-- Webhook logs table for tracking payment provider webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- 'paypal', 'stripe', etc.
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_data JSONB,
  processed_successfully BOOLEAN DEFAULT FALSE,
  processing_attempts INTEGER DEFAULT 0,
  error_details TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  UNIQUE(provider, event_id) -- Prevent duplicate webhook processing
);

-- Indexes for webhook_logs
CREATE INDEX IF NOT EXISTS webhook_logs_provider_idx ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS webhook_logs_event_type_idx ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS webhook_logs_created_at_idx ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS webhook_logs_processed_idx ON webhook_logs(processed_successfully, created_at);

-- Enhanced payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL, -- External payment system ID
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id TEXT, -- Link to subscription if applicable
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT, -- 'paypal', 'stripe', 'crypto'
  provider TEXT NOT NULL,
  provider_response JSONB, -- Full response from payment provider
  refund_id TEXT, -- If refunded
  refunded_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_payment_id_idx ON payments(payment_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_provider_idx ON payments(provider);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);
CREATE INDEX IF NOT EXISTS payments_subscription_id_idx ON payments(subscription_id);

-- Billing reconciliation reports
CREATE TABLE IF NOT EXISTS billing_reconciliation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_refunds DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  transactions_count INTEGER DEFAULT 0,
  reconciled_transactions INTEGER DEFAULT 0,
  discrepancies INTEGER DEFAULT 0,
  provider_totals JSONB DEFAULT '{}', -- Revenue by provider
  tier_totals JSONB DEFAULT '{}', -- Revenue by subscription tier
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  discrepancy_details JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for reconciliation reports
CREATE INDEX IF NOT EXISTS billing_reports_date_idx ON billing_reconciliation_reports(report_date);
CREATE INDEX IF NOT EXISTS billing_reports_status_idx ON billing_reconciliation_reports(status);
CREATE INDEX IF NOT EXISTS billing_reports_created_at_idx ON billing_reconciliation_reports(created_at);

-- Revenue analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_analytics AS
SELECT 
  DATE(created_at) as date,
  provider,
  currency,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN status = 'refunded' THEN refunded_amount ELSE 0 END) as total_refunds,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN status = 'refunded' THEN refunded_amount ELSE 0 END) as net_revenue,
  AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_transaction_value
FROM payments
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), provider, currency
ORDER BY date DESC, provider;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS revenue_analytics_unique_idx 
ON revenue_analytics(date, provider, currency);

-- Function to refresh revenue analytics
CREATE OR REPLACE FUNCTION refresh_revenue_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate reconciliation report
CREATE OR REPLACE FUNCTION generate_reconciliation_report(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  revenue_total DECIMAL(12,2);
  refund_total DECIMAL(12,2);
  transaction_count INTEGER;
  reconciled_count INTEGER;
  provider_breakdown JSONB;
  tier_breakdown JSONB;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'refunded' THEN refunded_amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status IN ('completed', 'refunded') THEN 1 END)
  INTO revenue_total, refund_total, transaction_count, reconciled_count
  FROM payments
  WHERE created_at >= p_start_date AND created_at <= p_end_date;

  -- Provider breakdown
  SELECT jsonb_object_agg(provider, provider_total)
  INTO provider_breakdown
  FROM (
    SELECT 
      provider,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as provider_total
    FROM payments
    WHERE created_at >= p_start_date AND created_at <= p_end_date
    GROUP BY provider
  ) t;

  -- Tier breakdown (from subscription changes)
  SELECT jsonb_object_agg(to_tier, tier_total)
  INTO tier_breakdown
  FROM (
    SELECT 
      sc.to_tier,
      COALESCE(SUM(p.amount), 0) as tier_total
    FROM subscription_changes sc
    LEFT JOIN payments p ON p.payment_id = sc.payment_id
    WHERE sc.created_at >= p_start_date AND sc.created_at <= p_end_date
    GROUP BY sc.to_tier
  ) t;

  -- Insert report
  INSERT INTO billing_reconciliation_reports (
    report_date,
    period_start,
    period_end,
    total_revenue,
    total_refunds,
    net_revenue,
    transactions_count,
    reconciled_transactions,
    discrepancies,
    provider_totals,
    tier_totals,
    status,
    created_by,
    completed_at
  ) VALUES (
    CURRENT_DATE,
    p_start_date,
    p_end_date,
    revenue_total,
    refund_total,
    revenue_total - refund_total,
    transaction_count,
    reconciled_count,
    transaction_count - reconciled_count,
    COALESCE(provider_breakdown, '{}'),
    COALESCE(tier_breakdown, '{}'),
    'completed',
    p_created_by,
    NOW()
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get billing metrics for dashboard
CREATE OR REPLACE FUNCTION get_billing_metrics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_revenue DECIMAL(12,2),
  monthly_recurring_revenue DECIMAL(12,2),
  total_customers INTEGER,
  active_subscriptions INTEGER,
  churn_rate DECIMAL(5,2),
  revenue_by_tier JSONB,
  revenue_growth DECIMAL(5,2)
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
  prev_start_date TIMESTAMPTZ;
  current_revenue DECIMAL(12,2);
  previous_revenue DECIMAL(12,2);
BEGIN
  start_date := NOW() - (p_days || ' days')::INTERVAL;
  prev_start_date := start_date - (p_days || ' days')::INTERVAL;

  -- Current period revenue
  SELECT COALESCE(SUM(amount), 0)
  INTO current_revenue
  FROM payments
  WHERE status = 'completed' 
    AND created_at >= start_date;

  -- Previous period revenue for growth calculation
  SELECT COALESCE(SUM(amount), 0)
  INTO previous_revenue
  FROM payments
  WHERE status = 'completed' 
    AND created_at >= prev_start_date 
    AND created_at < start_date;

  RETURN QUERY
  SELECT 
    current_revenue as total_revenue,
    -- MRR calculation (simplified)
    (SELECT COALESCE(SUM(amount), 0) 
     FROM payments 
     WHERE status = 'completed' 
       AND created_at >= date_trunc('month', NOW())
    ) as monthly_recurring_revenue,
    -- Total customers
    (SELECT COUNT(DISTINCT user_id) 
     FROM payments 
     WHERE user_id IS NOT NULL
    )::INTEGER as total_customers,
    -- Active subscriptions
    (SELECT COUNT(*) 
     FROM profiles 
     WHERE subscription_status = 'active'
    )::INTEGER as active_subscriptions,
    -- Churn rate (simplified calculation)
    5.2::DECIMAL(5,2) as churn_rate, -- Placeholder
    -- Revenue by tier
    (SELECT jsonb_object_agg(subscription_tier, tier_revenue)
     FROM (
       SELECT 
         COALESCE(pr.subscription_tier, 'free') as subscription_tier,
         COALESCE(SUM(p.amount), 0) as tier_revenue
       FROM payments p
       LEFT JOIN profiles pr ON pr.id = p.user_id
       WHERE p.status = 'completed' AND p.created_at >= start_date
       GROUP BY pr.subscription_tier
     ) t
    ) as revenue_by_tier,
    -- Revenue growth percentage
    (CASE 
      WHEN previous_revenue > 0 THEN 
        ((current_revenue - previous_revenue) / previous_revenue * 100)
      ELSE 0 
    END)::DECIMAL(5,2) as revenue_growth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for new tables
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- Service role can manage all billing data
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payments" ON payments 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage reconciliation reports" ON billing_reconciliation_reports 
FOR ALL USING (auth.role() = 'service_role');

-- Admins can view billing data
CREATE POLICY "Admins can view webhook logs" ON webhook_logs 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can view payments" ON payments 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can view reconciliation reports" ON billing_reconciliation_reports 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments 
FOR SELECT USING (auth.uid() = user_id);

-- Cleanup function for old webhook logs and processed data
CREATE OR REPLACE FUNCTION cleanup_billing_data()
RETURNS void AS $$
BEGIN
  -- Delete old webhook logs (keep 90 days)
  DELETE FROM webhook_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Archive old reconciliation reports (keep 2 years)
  -- In production, you might move these to an archive table instead
  DELETE FROM billing_reconciliation_reports 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Refresh revenue analytics
  PERFORM refresh_revenue_analytics();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-billing-data', '0 3 * * 0', 'SELECT cleanup_billing_data();');