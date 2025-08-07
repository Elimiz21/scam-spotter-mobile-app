import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource_version: string;
  create_time: string;
  resource: any;
  summary: string;
}

interface BillingReconciliationResult {
  success: boolean;
  processed: number;
  errors: string[];
  reconciled: {
    subscriptions: number;
    payments: number;
    refunds: number;
    cancelled: number;
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

    if (req.method === 'POST') {
      // Handle PayPal webhook for real-time reconciliation
      return await handlePayPalWebhook(req, supabaseClient);
    } else if (req.method === 'GET') {
      // Handle manual reconciliation request
      return await handleManualReconciliation(req, supabaseClient);
    } else {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Billing reconciliation error:', error);
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

async function handlePayPalWebhook(req: Request, supabase: any): Promise<Response> {
  try {
    // Verify PayPal webhook signature (in production)
    const webhookData: PayPalWebhookEvent = await req.json();
    
    console.log('Processing PayPal webhook:', webhookData.event_type);

    let result: BillingReconciliationResult = {
      success: false,
      processed: 0,
      errors: [],
      reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
    };

    switch (webhookData.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        result = await handleSubscriptionActivated(webhookData, supabase);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        result = await handleSubscriptionCancelled(webhookData, supabase);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        result = await handlePaymentCompleted(webhookData, supabase);
        break;
      case 'PAYMENT.SALE.REFUNDED':
        result = await handlePaymentRefunded(webhookData, supabase);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event_type);
        result.success = true; // Don't fail for unhandled events
    }

    // Log webhook processing
    await supabase.from('webhook_logs').insert({
      provider: 'paypal',
      event_type: webhookData.event_type,
      event_id: webhookData.id,
      processed_successfully: result.success,
      error_details: result.errors.length > 0 ? result.errors : null,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleManualReconciliation(req: Request, supabase: any): Promise<Response> {
  // Get query parameters
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get('days') || '7');
  const force = url.searchParams.get('force') === 'true';

  console.log(`Starting manual reconciliation for last ${days} days (force: ${force})`);

  try {
    const result = await performReconciliation(supabase, days, force);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Reconciliation completed for ${days} days`,
        result,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Manual reconciliation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleSubscriptionActivated(event: PayPalWebhookEvent, supabase: any): Promise<BillingReconciliationResult> {
  const subscription = event.resource;
  const result: BillingReconciliationResult = {
    success: false,
    processed: 0,
    errors: [],
    reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
  };

  try {
    // Extract user information from subscription custom_id or payer info
    const customId = subscription.custom_id || subscription.subscriber?.payer_id;
    
    if (!customId) {
      result.errors.push('No user identifier found in subscription');
      return result;
    }

    // Find user by custom ID (should be user UUID)
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', customId)
      .single();

    if (userError || !user) {
      result.errors.push(`User not found: ${customId}`);
      return result;
    }

    // Determine subscription tier from plan ID
    const planId = subscription.plan_id;
    const tier = mapPayPalPlanToTier(planId);

    // Update user subscription
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_period_start: new Date().toISOString(),
        subscription_period_end: calculateNextBillingDate(subscription.billing_info?.next_billing_time),
        payment_provider: 'paypal',
        payment_customer_id: subscription.id,
      })
      .eq('id', user.id);

    if (updateError) {
      result.errors.push(`Failed to update user subscription: ${updateError.message}`);
      return result;
    }

    // Record subscription change
    await supabase.from('subscription_changes').insert({
      user_id: user.id,
      from_tier: 'free', // Could be retrieved from current profile
      to_tier: tier,
      change_type: 'activation',
      payment_id: subscription.id,
      payment_provider: 'paypal',
      effective_date: new Date().toISOString(),
    });

    result.success = true;
    result.processed = 1;
    result.reconciled.subscriptions = 1;

    console.log(`Subscription activated for user ${user.email}: ${tier}`);

  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

async function handleSubscriptionCancelled(event: PayPalWebhookEvent, supabase: any): Promise<BillingReconciliationResult> {
  const subscription = event.resource;
  const result: BillingReconciliationResult = {
    success: false,
    processed: 0,
    errors: [],
    reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
  };

  try {
    // Find user by PayPal subscription ID
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier')
      .eq('payment_customer_id', subscription.id)
      .single();

    if (userError || !user) {
      result.errors.push(`User not found for subscription: ${subscription.id}`);
      return result;
    }

    // Update user subscription status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        // Keep current tier until period ends
      })
      .eq('id', user.id);

    if (updateError) {
      result.errors.push(`Failed to update user subscription: ${updateError.message}`);
      return result;
    }

    // Record subscription change
    await supabase.from('subscription_changes').insert({
      user_id: user.id,
      from_tier: user.subscription_tier,
      to_tier: 'free', // Will take effect at period end
      change_type: 'cancellation',
      payment_id: subscription.id,
      payment_provider: 'paypal',
      effective_date: user.subscription_period_end || new Date().toISOString(),
    });

    result.success = true;
    result.processed = 1;
    result.reconciled.cancelled = 1;

    console.log(`Subscription cancelled for user ${user.email}`);

  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

async function handlePaymentCompleted(event: PayPalWebhookEvent, supabase: any): Promise<BillingReconciliationResult> {
  const payment = event.resource;
  const result: BillingReconciliationResult = {
    success: false,
    processed: 0,
    errors: [],
    reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
  };

  try {
    // Record payment in database
    await supabase.from('payments').insert({
      payment_id: payment.id,
      user_id: payment.custom || null,
      amount: parseFloat(payment.amount?.total || '0'),
      currency: payment.amount?.currency || 'USD',
      status: 'completed',
      provider: 'paypal',
      provider_response: payment,
      created_at: payment.create_time || new Date().toISOString(),
    });

    result.success = true;
    result.processed = 1;
    result.reconciled.payments = 1;

    console.log(`Payment recorded: ${payment.id} - $${payment.amount?.total}`);

  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

async function handlePaymentRefunded(event: PayPalWebhookEvent, supabase: any): Promise<BillingReconciliationResult> {
  const refund = event.resource;
  const result: BillingReconciliationResult = {
    success: false,
    processed: 0,
    errors: [],
    reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
  };

  try {
    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'refunded',
        refund_id: refund.id,
        refunded_at: new Date().toISOString(),
      })
      .eq('payment_id', refund.sale_id);

    if (updateError) {
      result.errors.push(`Failed to update payment: ${updateError.message}`);
      return result;
    }

    // Could also downgrade user subscription if needed
    
    result.success = true;
    result.processed = 1;
    result.reconciled.refunds = 1;

    console.log(`Payment refunded: ${refund.sale_id} - $${refund.amount?.total}`);

  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

async function performReconciliation(supabase: any, days: number, force: boolean): Promise<BillingReconciliationResult> {
  const result: BillingReconciliationResult = {
    success: false,
    processed: 0,
    errors: [],
    reconciled: { subscriptions: 0, payments: 0, refunds: 0, cancelled: 0 }
  };

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all payments from the specified period
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (paymentsError) {
      result.errors.push(`Failed to fetch payments: ${paymentsError.message}`);
      return result;
    }

    // Get subscription changes from the period
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscription_changes')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      result.errors.push(`Failed to fetch subscriptions: ${subscriptionsError.message}`);
      return result;
    }

    // Reconcile payments (simplified)
    result.reconciled.payments = payments?.length || 0;
    result.reconciled.subscriptions = subscriptions?.length || 0;
    result.processed = result.reconciled.payments + result.reconciled.subscriptions;
    result.success = true;

    console.log(`Reconciliation completed: ${result.processed} records processed`);

  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

// Helper functions
function mapPayPalPlanToTier(planId: string): string {
  // Map PayPal plan IDs to subscription tiers
  const planMapping: Record<string, string> = {
    'P-5ML4271244454362WXNWU5NQ': 'basic',
    'P-1GJ4HJKHJKHJKHJKHNU5NQ': 'premium', 
    'P-2AB4HJKHJKHJKHJKHNU5NQ': 'pro',
  };
  
  return planMapping[planId] || 'basic';
}

function calculateNextBillingDate(nextBillingTime?: string): string {
  if (nextBillingTime) {
    return nextBillingTime;
  }
  
  // Default to 1 month from now
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString();
}