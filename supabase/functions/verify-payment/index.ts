import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = "AWjx87BfEed5z3v8YPlp7JT-UyT4RjXbyv2grFbxjDzzsT4_-tvxiEuLFONjisFzhZOLAIqfK7z-qO2T";
const PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"; // Change to https://api-m.paypal.com for live

async function getPayPalAccessToken() {
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientSecret) {
    throw new Error("PAYPAL_CLIENT_SECRET not found");
  }

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    const { order_id, subscription_id } = await req.json();

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    if (order_id) {
      // Verify one-time payment
      const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${order_id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const order = await orderResponse.json();

      if (order.status === "COMPLETED") {
        // Update payment status and add credits to user
        await supabase.from("payments").update({
          status: "completed"
        }).eq("paypal_order_id", order_id);

        return new Response(JSON.stringify({ 
          success: true,
          message: "Payment verified and 1 check credit added to your account"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (subscription_id) {
      // Verify subscription
      const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscription_id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const subscription = await subscriptionResponse.json();

      if (subscription.status === "ACTIVE") {
        // Update subscription status
        await supabase.from("subscriptions").update({
          status: "active",
          next_billing_date: subscription.billing_info?.next_billing_time
        }).eq("paypal_subscription_id", subscription_id);

        return new Response(JSON.stringify({ 
          success: true,
          message: "Subscription activated successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: false,
      message: "Payment verification failed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});