import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  tier?: 'free' | 'basic' | 'premium' | 'pro';
}

interface RateLimitRecord {
  user_id: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  tier: string;
}

const RATE_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  free: {
    'single-check': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    'group-analysis': { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 }, // 1 per day
    'ai-language-analysis': { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2 per hour
  },
  basic: {
    'single-check': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
    'group-analysis': { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
    'ai-language-analysis': { maxRequests: 15, windowMs: 60 * 60 * 1000 }, // 15 per hour
  },
  premium: {
    'single-check': { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    'group-analysis': { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 per day
    'ai-language-analysis': { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  },
  pro: {
    'single-check': { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
    'group-analysis': { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100 per day
    'ai-language-analysis': { maxRequests: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour
  },
};

export async function rateLimitCheck(
  supabase: any,
  userId: string,
  endpoint: string,
  userTier: string = 'free'
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}> {
  const config = RATE_LIMITS[userTier]?.[endpoint];
  
  if (!config) {
    // If no rate limit configured, allow the request
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60000,
    };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Get current usage for this user and endpoint within the window
    const { data: existingRecords, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false });

    if (fetchError) {
      console.error('Error fetching rate limit records:', fetchError);
      // In case of error, allow the request but log it
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: Date.now() + config.windowMs,
      };
    }

    // Calculate total requests in current window
    const totalRequests = existingRecords?.reduce((sum, record) => sum + record.request_count, 0) || 0;

    if (totalRequests >= config.maxRequests) {
      const oldestRecord = existingRecords[existingRecords.length - 1];
      const resetTime = new Date(oldestRecord.window_start).getTime() + config.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        message: `Rate limit exceeded. You've made ${totalRequests} requests in the current window. Limit is ${config.maxRequests}. Resets at ${new Date(resetTime).toISOString()}.`,
      };
    }

    // Update or create rate limit record
    const currentWindowStart = new Date(Math.floor(now.getTime() / config.windowMs) * config.windowMs);
    
    const { data: currentRecord } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('window_start', currentWindowStart.toISOString())
      .single();

    if (currentRecord) {
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({ 
          request_count: currentRecord.request_count + 1,
          tier: userTier,
        })
        .eq('id', currentRecord.id);
    } else {
      // Create new record
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint,
          request_count: 1,
          window_start: currentWindowStart.toISOString(),
          tier: userTier,
        });
    }

    const remaining = Math.max(0, config.maxRequests - (totalRequests + 1));
    const resetTime = currentWindowStart.getTime() + config.windowMs;

    return {
      allowed: true,
      remaining,
      resetTime,
    };

  } catch (error) {
    console.error('Rate limiting error:', error);
    // In case of error, allow the request
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { endpoint, action } = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's subscription tier
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const userTier = profile?.subscription_tier || 'free';

    if (action === 'check') {
      // Check rate limit without consuming a request
      const result = await rateLimitCheck(supabaseClient, user.id, endpoint, userTier);
      
      return new Response(
        JSON.stringify({
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: result.resetTime,
          message: result.message,
        }),
        { 
          status: result.allowed ? 200 : 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMITS[userTier]?.[endpoint]?.maxRequests?.toString() || '0',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          } 
        }
      );
    } else {
      // Default action: consume a request and check limit
      const result = await rateLimitCheck(supabaseClient, user.id, endpoint, userTier);
      
      return new Response(
        JSON.stringify({
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: result.resetTime,
          message: result.message,
        }),
        { 
          status: result.allowed ? 200 : 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMITS[userTier]?.[endpoint]?.maxRequests?.toString() || '0',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          } 
        }
      );
    }

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});