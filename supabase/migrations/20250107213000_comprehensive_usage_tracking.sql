-- Enhanced user usage tracking system

-- Add subscription fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_provider TEXT; -- 'paypal', 'stripe', etc.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_customer_id TEXT; -- External payment system customer ID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'suspended'));

-- User usage logs table for detailed tracking
CREATE TABLE IF NOT EXISTS user_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT valid_usage_type CHECK (usage_type IN (
    'single_check', 'group_analysis', 'ai_analysis', 
    'export_report', 'api_call', 'database_query'
  ))
);

-- Indexes for user_usage_logs
CREATE INDEX IF NOT EXISTS user_usage_logs_user_id_idx ON user_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS user_usage_logs_usage_type_idx ON user_usage_logs(usage_type);
CREATE INDEX IF NOT EXISTS user_usage_logs_created_at_idx ON user_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS user_usage_logs_user_type_date_idx ON user_usage_logs(user_id, usage_type, created_at);

-- Subscription changes history
CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier TEXT,
  to_tier TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation', 'reactivation')),
  payment_id TEXT,
  payment_provider TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for subscription_changes
CREATE INDEX IF NOT EXISTS subscription_changes_user_id_idx ON subscription_changes(user_id);
CREATE INDEX IF NOT EXISTS subscription_changes_effective_date_idx ON subscription_changes(effective_date);
CREATE INDEX IF NOT EXISTS subscription_changes_payment_id_idx ON subscription_changes(payment_id);

-- Usage aggregation table for performance (materialized view alternative)
CREATE TABLE IF NOT EXISTS usage_aggregations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  single_checks INTEGER DEFAULT 0,
  group_analyses INTEGER DEFAULT 0,
  ai_analyses INTEGER DEFAULT 0,
  export_reports INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  database_queries INTEGER DEFAULT 0,
  total_usage INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

-- Indexes for usage_aggregations
CREATE INDEX IF NOT EXISTS usage_aggregations_user_id_idx ON usage_aggregations(user_id);
CREATE INDEX IF NOT EXISTS usage_aggregations_period_idx ON usage_aggregations(period_start, period_end);

-- Function to record user usage
CREATE OR REPLACE FUNCTION record_user_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert usage log
  INSERT INTO user_usage_logs (
    user_id,
    usage_type,
    quantity,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_usage_type,
    p_quantity,
    p_metadata,
    p_ip_address,
    p_user_agent
  );
  
  -- Update or insert aggregation for current month
  INSERT INTO usage_aggregations (
    user_id,
    period_start,
    period_end,
    single_checks,
    group_analyses,
    ai_analyses,
    export_reports,
    api_calls,
    database_queries,
    total_usage
  )
  SELECT 
    p_user_id,
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
    CASE WHEN p_usage_type = 'single_check' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'group_analysis' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'ai_analysis' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'export_report' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'api_call' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'database_query' THEN p_quantity ELSE 0 END,
    p_quantity
  ON CONFLICT (user_id, period_start, period_end)
  DO UPDATE SET
    single_checks = usage_aggregations.single_checks + 
      CASE WHEN p_usage_type = 'single_check' THEN p_quantity ELSE 0 END,
    group_analyses = usage_aggregations.group_analyses + 
      CASE WHEN p_usage_type = 'group_analysis' THEN p_quantity ELSE 0 END,
    ai_analyses = usage_aggregations.ai_analyses + 
      CASE WHEN p_usage_type = 'ai_analysis' THEN p_quantity ELSE 0 END,
    export_reports = usage_aggregations.export_reports + 
      CASE WHEN p_usage_type = 'export_report' THEN p_quantity ELSE 0 END,
    api_calls = usage_aggregations.api_calls + 
      CASE WHEN p_usage_type = 'api_call' THEN p_quantity ELSE 0 END,
    database_queries = usage_aggregations.database_queries + 
      CASE WHEN p_usage_type = 'database_query' THEN p_quantity ELSE 0 END,
    total_usage = usage_aggregations.total_usage + p_quantity,
    last_updated = NOW();
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(
  p_user_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  single_checks INTEGER,
  group_analyses INTEGER,
  ai_analyses INTEGER,
  export_reports INTEGER,
  api_calls INTEGER,
  database_queries INTEGER,
  total_usage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ua.single_checks, 0) as single_checks,
    COALESCE(ua.group_analyses, 0) as group_analyses,
    COALESCE(ua.ai_analyses, 0) as ai_analyses,
    COALESCE(ua.export_reports, 0) as export_reports,
    COALESCE(ua.api_calls, 0) as api_calls,
    COALESCE(ua.database_queries, 0) as database_queries,
    COALESCE(ua.total_usage, 0) as total_usage
  FROM usage_aggregations ua
  WHERE ua.user_id = p_user_id
    AND ua.period_start >= p_period_start
    AND ua.period_end <= p_period_end
  ORDER BY ua.period_start DESC
  LIMIT 1;
  
  -- If no aggregated data found, calculate from logs
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      COALESCE(SUM(CASE WHEN usage_type = 'single_check' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN usage_type = 'group_analysis' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN usage_type = 'ai_analysis' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN usage_type = 'export_report' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN usage_type = 'api_call' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN usage_type = 'database_query' THEN quantity ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(quantity), 0)::INTEGER
    FROM user_usage_logs
    WHERE user_id = p_user_id
      AND created_at >= p_period_start
      AND created_at <= p_period_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system-wide usage statistics
CREATE OR REPLACE FUNCTION get_system_usage_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_users INTEGER,
  active_users INTEGER,
  total_usage INTEGER,
  usage_by_type JSONB,
  usage_by_tier JSONB,
  top_users JSONB
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
    (SELECT COUNT(DISTINCT user_id)::INTEGER 
     FROM user_usage_logs 
     WHERE created_at >= start_date) as active_users,
    (SELECT COALESCE(SUM(quantity), 0)::INTEGER 
     FROM user_usage_logs 
     WHERE created_at >= start_date) as total_usage,
    (SELECT jsonb_object_agg(usage_type, usage_count)
     FROM (
       SELECT usage_type, SUM(quantity) as usage_count
       FROM user_usage_logs
       WHERE created_at >= start_date
       GROUP BY usage_type
     ) t) as usage_by_type,
    (SELECT jsonb_object_agg(subscription_tier, user_count)
     FROM (
       SELECT 
         COALESCE(p.subscription_tier, 'free') as subscription_tier,
         COUNT(DISTINCT ual.user_id) as user_count
       FROM user_usage_logs ual
       LEFT JOIN profiles p ON p.id = ual.user_id
       WHERE ual.created_at >= start_date
       GROUP BY p.subscription_tier
     ) t) as usage_by_tier,
    (SELECT jsonb_agg(
       jsonb_build_object(
         'user_id', user_id,
         'total_usage', total_usage,
         'tier', tier
       )
     )
     FROM (
       SELECT 
         ual.user_id,
         SUM(ual.quantity) as total_usage,
         COALESCE(p.subscription_tier, 'free') as tier
       FROM user_usage_logs ual
       LEFT JOIN profiles p ON p.id = ual.user_id
       WHERE ual.created_at >= start_date
       GROUP BY ual.user_id, p.subscription_tier
       ORDER BY total_usage DESC
       LIMIT 10
     ) t) as top_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users near their usage limits
CREATE OR REPLACE FUNCTION get_users_near_limit(
  p_threshold FLOAT DEFAULT 0.8
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  tier TEXT,
  usage_percentage FLOAT,
  days_until_reset INTEGER
) AS $$
BEGIN
  -- This is a simplified version - in production you'd calculate actual percentages
  -- based on tier limits and current usage
  RETURN QUERY
  SELECT 
    p.id as user_id,
    au.email,
    COALESCE(p.subscription_tier, 'free') as tier,
    0.85::FLOAT as usage_percentage, -- Placeholder
    EXTRACT(DAY FROM (p.subscription_period_end - NOW()))::INTEGER as days_until_reset
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.subscription_period_end > NOW()
    AND EXTRACT(DAY FROM (p.subscription_period_end - NOW())) <= 7
  ORDER BY usage_percentage DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for new tables
ALTER TABLE user_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregations ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage logs
CREATE POLICY "Users can view own usage logs" ON user_usage_logs 
FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own subscription changes
CREATE POLICY "Users can view own subscription changes" ON subscription_changes 
FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own usage aggregations
CREATE POLICY "Users can view own usage aggregations" ON usage_aggregations 
FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all usage data
CREATE POLICY "Service role can manage usage logs" ON user_usage_logs 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscription changes" ON subscription_changes 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage usage aggregations" ON usage_aggregations 
FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all usage data
CREATE POLICY "Admins can view all usage logs" ON user_usage_logs 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can view all subscription changes" ON subscription_changes 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can view all usage aggregations" ON usage_aggregations 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Cleanup function for old usage logs (keep only 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs()
RETURNS void AS $$
BEGIN
  -- Delete usage logs older than 1 year
  DELETE FROM user_usage_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete usage aggregations older than 2 years
  DELETE FROM usage_aggregations 
  WHERE period_end < NOW() - INTERVAL '2 years';
  
  -- Update expired subscriptions
  UPDATE profiles 
  SET subscription_status = 'expired'
  WHERE subscription_status = 'active' 
    AND subscription_period_end < NOW();
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update usage aggregations
CREATE OR REPLACE FUNCTION update_usage_aggregation_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger would update aggregations in real-time
  -- For now, we rely on the record_user_usage function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out to avoid performance issues in demo)
-- CREATE TRIGGER usage_aggregation_trigger
--   AFTER INSERT ON user_usage_logs
--   FOR EACH ROW
--   EXECUTE FUNCTION update_usage_aggregation_trigger();

-- Create scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-usage-logs', '0 2 * * 0', 'SELECT cleanup_old_usage_logs();');