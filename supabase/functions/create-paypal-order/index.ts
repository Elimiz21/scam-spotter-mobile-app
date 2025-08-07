import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment-based configuration
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "AaZ9M2j7n6MCkQx0Oi8X0dpVeZkvDeiVhyyY7Iumx4CpWAUhCe56ULt-Tdtxab0xakVzONSMQ2ICz74N"; // Fallback to sandbox
const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || "development";
const PAYPAL_BASE_URL = ENVIRONMENT === "production" 
  ? "https://api-m.paypal.com"  // Production
  : "https://api-m.sandbox.paypal.com"; // Sandbox/Development

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

    const { payment_type } = await req.json();
    
    if (payment_type !== "pay_per_check") {
      throw new Error("Invalid payment type");
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: "4.99"
        },
        description: "1 Scam Check Credit"
      }],
      application_context: {
        return_url: `${req.headers.get("origin")}/payment-success`,
        cancel_url: `${req.headers.get("origin")}/pricing`,
        brand_name: "Scam Detector",
        user_action: "PAY_NOW"
      }
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(`PayPal order creation failed: ${JSON.stringify(order)}`);
    }

    // Store payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      paypal_order_id: order.id,
      payment_type: "pay_per_check",
      amount: 4.99,
      currency: "USD",
      status: "pending",
      checks_purchased: 1
    });

    const approveLink = order.links.find((link: any) => link.rel === "approve")?.href;

    return new Response(JSON.stringify({ 
      orderId: order.id,
      approveUrl: approveLink 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});