-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_window_idx 
ON rate_limits(user_id, endpoint, window_start);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx 
ON rate_limits(window_start);

-- Add RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits" ON rate_limits 
FOR SELECT USING (auth.uid() = user_id);

-- Only system (service_role) can insert/update rate limit records
CREATE POLICY "Service role can manage rate limits" ON rate_limits 
FOR ALL USING (auth.role() = 'service_role');

-- Add usage tracking to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_usage JSONB DEFAULT '{}';

-- Function to cleanup old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits();');

-- Add user check limits tracking
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- 'single_check', 'group_analysis', etc.
  usage_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for user_usage
CREATE INDEX IF NOT EXISTS user_usage_user_type_period_idx 
ON user_usage(user_id, usage_type, period_start, period_end);

-- Add RLS for user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON user_usage 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON user_usage 
FOR ALL USING (auth.role() = 'service_role');

-- Add function to get current usage for a user
CREATE OR REPLACE FUNCTION get_user_current_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_period_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(usage_count), 0)
  INTO usage_count
  FROM user_usage
  WHERE user_id = p_user_id
    AND usage_type = p_usage_type
    AND period_start >= NOW() - (p_period_hours || ' hours')::INTERVAL;
    
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to increment usage
CREATE OR REPLACE FUNCTION increment_user_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_tier TEXT DEFAULT 'free'
)
RETURNS void AS $$
DECLARE
  current_period_start TIMESTAMPTZ;
  current_period_end TIMESTAMPTZ;
BEGIN
  -- Calculate current period (daily reset)
  current_period_start := date_trunc('day', NOW());
  current_period_end := current_period_start + INTERVAL '1 day';
  
  -- Insert or update usage record
  INSERT INTO user_usage (user_id, usage_type, usage_count, period_start, period_end, tier)
  VALUES (p_user_id, p_usage_type, 1, current_period_start, current_period_end, p_tier)
  ON CONFLICT (user_id, usage_type, period_start)
  DO UPDATE SET 
    usage_count = user_usage.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to prevent duplicate usage records
ALTER TABLE user_usage ADD CONSTRAINT IF NOT EXISTS user_usage_unique 
UNIQUE (user_id, usage_type, period_start);