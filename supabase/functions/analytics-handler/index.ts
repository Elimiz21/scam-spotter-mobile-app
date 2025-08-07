import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
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

    const eventData: AnalyticsEvent = await req.json();

    // Validate event data
    if (!eventData.eventName) {
      return new Response(
        JSON.stringify({ error: 'Event name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize and prepare data for storage
    const analyticsRecord = {
      event_name: eventData.eventName,
      properties: eventData.properties ? JSON.stringify(eventData.properties) : null,
      user_id: eventData.userId || null,
      session_id: eventData.sessionId,
      timestamp: eventData.timestamp,
      created_at: new Date().toISOString(),
    };

    // Store in database
    const { error } = await supabaseClient
      .from('analytics_events')
      .insert([analyticsRecord]);

    if (error) {
      console.error('Failed to store analytics event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send to external analytics service if configured
    await sendToExternalAnalytics(eventData);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics handler error:', error);
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

async function sendToExternalAnalytics(event: AnalyticsEvent): Promise<void> {
  try {
    // Example: Send to Google Analytics, Mixpanel, etc.
    const gaTrackingId = Deno.env.get('GA_TRACKING_ID');
    
    if (gaTrackingId) {
      // Send to Google Analytics 4
      await fetch('https://www.google-analytics.com/mp/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: event.sessionId || 'anonymous',
          user_id: event.userId,
          events: [{
            name: event.eventName.replace(/[^a-zA-Z0-9_]/g, '_'), // GA4 event name format
            parameters: {
              ...event.properties,
              timestamp_micros: new Date(event.timestamp).getTime() * 1000,
            },
          }],
        }),
      });
    }

    // Example: Send to Mixpanel
    const mixpanelToken = Deno.env.get('MIXPANEL_TOKEN');
    
    if (mixpanelToken) {
      const mixpanelEvent = {
        event: event.eventName,
        properties: {
          ...event.properties,
          token: mixpanelToken,
          distinct_id: event.userId || event.sessionId,
          time: new Date(event.timestamp).getTime() / 1000,
        },
      };

      await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([mixpanelEvent]),
      });
    }

  } catch (error) {
    console.error('Failed to send to external analytics:', error);
  }
}