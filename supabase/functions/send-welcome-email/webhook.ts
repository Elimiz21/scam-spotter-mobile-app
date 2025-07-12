import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // This webhook will be triggered by Supabase auth events
    if (body.type === 'INSERT' && body.table === 'users' && body.schema === 'auth') {
      const user = body.record;
      
      // Call our custom welcome email function
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          user: {
            email: user.email
          },
          email_data: {
            token_hash: 'custom', // This will be handled by our custom email
            redirect_to: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/`,
            email_action_type: 'signup'
          }
        }
      });

      if (error) {
        console.error('Error sending welcome email:', error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});