-- Application logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  message TEXT NOT NULL,
  context TEXT, -- JSON string
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  url TEXT,
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  performance_duration INTEGER, -- milliseconds
  performance_memory INTEGER, -- bytes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for application_logs
CREATE INDEX IF NOT EXISTS application_logs_timestamp_idx ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS application_logs_level_idx ON application_logs(level);
CREATE INDEX IF NOT EXISTS application_logs_user_id_idx ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS application_logs_session_id_idx ON application_logs(session_id);
CREATE INDEX IF NOT EXISTS application_logs_created_at_idx ON application_logs(created_at);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  properties TEXT, -- JSON string
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);

-- System metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  labels JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for system_metrics
CREATE INDEX IF NOT EXISTS system_metrics_name_idx ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS system_metrics_timestamp_idx ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS system_metrics_user_id_idx ON system_metrics(user_id);
CREATE INDEX IF NOT EXISTS system_metrics_labels_idx ON system_metrics USING GIN(labels);

-- Error tracking table for aggregated error analysis
CREATE TABLE IF NOT EXISTS error_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_signature TEXT NOT NULL, -- hash of error name + message
  error_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_users INTEGER DEFAULT 0,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error_tracking
CREATE UNIQUE INDEX IF NOT EXISTS error_tracking_signature_idx ON error_tracking(error_signature);
CREATE INDEX IF NOT EXISTS error_tracking_status_idx ON error_tracking(status);
CREATE INDEX IF NOT EXISTS error_tracking_first_seen_idx ON error_tracking(first_seen);
CREATE INDEX IF NOT EXISTS error_tracking_last_seen_idx ON error_tracking(last_seen);

-- Function to update error tracking
CREATE OR REPLACE FUNCTION update_error_tracking(
  p_error_name TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  error_sig TEXT;
  error_id UUID;
  affected_users_count INTEGER;
BEGIN
  -- Generate error signature
  error_sig := encode(digest(p_error_name || ':' || p_error_message, 'sha256'), 'hex');
  
  -- Count affected users for this error
  SELECT COUNT(DISTINCT user_id) INTO affected_users_count
  FROM application_logs
  WHERE error_name = p_error_name 
    AND error_message = p_error_message
    AND user_id IS NOT NULL;
  
  -- Insert or update error tracking
  INSERT INTO error_tracking (
    error_signature,
    error_name,
    error_message,
    first_seen,
    last_seen,
    occurrence_count,
    affected_users,
    stack_trace,
    context
  )
  VALUES (
    error_sig,
    p_error_name,
    p_error_message,
    NOW(),
    NOW(),
    1,
    CASE WHEN p_user_id IS NOT NULL THEN 1 ELSE 0 END,
    p_stack_trace,
    p_context
  )
  ON CONFLICT (error_signature)
  DO UPDATE SET
    last_seen = NOW(),
    occurrence_count = error_tracking.occurrence_count + 1,
    affected_users = affected_users_count,
    stack_trace = COALESCE(p_stack_trace, error_tracking.stack_trace),
    context = error_tracking.context || p_context,
    updated_at = NOW()
  RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_overview AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_events,
  AVG(performance_duration) as avg_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY performance_duration) as p50_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY performance_duration) as p95_duration,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY performance_duration) as p99_duration,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM application_logs
WHERE performance_duration IS NOT NULL
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Error rate view
CREATE OR REPLACE VIEW error_rate_overview AS
SELECT 
  DATE(timestamp) as date,
  level,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM application_logs
WHERE level IN ('ERROR', 'FATAL')
GROUP BY DATE(timestamp), level
ORDER BY date DESC, level;

-- User activity view
CREATE OR REPLACE VIEW user_activity_overview AS
SELECT 
  DATE(timestamp) as date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
GROUP BY DATE(timestamp), event_name
ORDER BY date DESC, event_count DESC;

-- Cleanup function for old logs (keep only 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete old application logs (older than 30 days)
  DELETE FROM application_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old analytics events (older than 90 days)
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old system metrics (older than 7 days)
  DELETE FROM system_metrics 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Update error tracking status for resolved errors (no occurrences in 14 days)
  UPDATE error_tracking 
  SET status = 'resolved', updated_at = NOW()
  WHERE status = 'open' 
    AND last_seen < NOW() - INTERVAL '14 days';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies (only service role can write logs)
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/manage monitoring data
CREATE POLICY "Service role can manage logs" ON application_logs 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage analytics" ON analytics_events 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage metrics" ON system_metrics 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage error tracking" ON error_tracking 
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own data (optional for debugging)
CREATE POLICY "Users can view own logs" ON application_logs 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON analytics_events 
FOR SELECT USING (auth.uid() = user_id);