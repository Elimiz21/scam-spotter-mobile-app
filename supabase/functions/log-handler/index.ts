import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration?: number;
    memoryUsed?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { logs } = await req.json();

    if (!Array.isArray(logs)) {
      return new Response(
        JSON.stringify({ error: 'Invalid logs format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate and sanitize logs
    const validatedLogs = logs.map((log: LogEntry) => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message.substring(0, 1000), // Limit message length
      context: log.context ? JSON.stringify(log.context).substring(0, 5000) : null,
      user_id: log.userId || null,
      session_id: log.sessionId,
      user_agent: log.userAgent?.substring(0, 500),
      url: log.url?.substring(0, 500),
      error_name: log.error?.name,
      error_message: log.error?.message?.substring(0, 1000),
      error_stack: log.error?.stack?.substring(0, 5000),
      performance_duration: log.performance?.duration,
      performance_memory: log.performance?.memoryUsed,
      created_at: new Date().toISOString(),
    }));

    // Insert logs into database
    const { error } = await supabaseClient
      .from('application_logs')
      .insert(validatedLogs);

    if (error) {
      console.error('Failed to insert logs:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store logs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send critical errors to external monitoring service (if configured)
    const criticalLogs = validatedLogs.filter(log => 
      log.level === 'ERROR' || log.level === 'FATAL'
    );

    if (criticalLogs.length > 0) {
      await sendToExternalMonitoring(criticalLogs);
    }

    return new Response(
      JSON.stringify({ success: true, processed: validatedLogs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Log handler error:', error);
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

async function sendToExternalMonitoring(logs: any[]): Promise<void> {
  try {
    // Example: Send to Sentry, DataDog, etc.
    const webhookUrl = Deno.env.get('MONITORING_WEBHOOK_URL');
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: 'scam-dunk',
          environment: Deno.env.get('ENVIRONMENT') || 'production',
          logs: logs,
        }),
      });
    }
  } catch (error) {
    console.error('Failed to send to external monitoring:', error);
  }
}