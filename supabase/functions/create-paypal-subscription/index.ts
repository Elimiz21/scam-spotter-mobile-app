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

    const { plan_type } = await req.json();
    
    if (!["premium", "pro"].includes(plan_type)) {
      throw new Error("Invalid plan type");
    }

    const planDetails = {
      premium: { amount: "9.99", name: "Premium Plan" },
      pro: { amount: "29.99", name: "Pro Plan" }
    };

    const plan = planDetails[plan_type as keyof typeof planDetails];

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create subscription
    const subscriptionData = {
      plan_id: `${plan_type.toUpperCase()}_PLAN`, // You'll need to create these plans in PayPal dashboard
      start_time: new Date().toISOString(),
      quantity: "1",
      shipping_amount: {
        currency_code: "USD",
        value: "0.00"
      },
      subscriber: {
        email_address: user.email
      },
      application_context: {
        brand_name: "Scam Detector",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${req.headers.get("origin")}/subscription-success`,
        cancel_url: `${req.headers.get("origin")}/pricing`
      }
    };

    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    const subscription = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      throw new Error(`PayPal subscription creation failed: ${JSON.stringify(subscription)}`);
    }

    // Store subscription record
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      paypal_subscription_id: subscription.id,
      plan_type,
      amount: parseFloat(plan.amount),
      currency: "USD",
      status: "active"
    });

    const approveLink = subscription.links.find((link: any) => link.rel === "approve")?.href;

    return new Response(JSON.stringify({ 
      subscriptionId: subscription.id,
      approveUrl: approveLink 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating PayPal subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});