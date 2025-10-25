/**
 * Stripe Webhook Handler Edge Function
 * 
 * Processes Stripe webhook events for subscription management.
 * - Verifies webhook signatures
 * - Handles subscription lifecycle events
 * - Updates local subscription records
 * - Logs all events for compliance
 * 
 * Security: Webhook signature verification, idempotent processing
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    
    // Verify webhook signature
    const event = await verifyStripeSignature(body, signature, stripeWebhookSecret);
    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing Stripe event:', event.type);

    // Process the event
    await processStripeEvent(event);

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<any | null> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.split('=')[1]);

    if (!timestamp || signatures.length === 0) {
      return null;
    }

    // Check timestamp tolerance (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      console.error('Webhook timestamp too old');
      return null;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures
    if (!signatures.includes(expectedSignature)) {
      console.error('Signature mismatch');
      return null;
    }

    return JSON.parse(payload);
  } catch (error) {
    console.error('Signature verification error:', error);
    return null;
  }
}

/**
 * Process Stripe webhook event
 */
async function processStripeEvent(event: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('subscription_audit_log')
    .select('id')
    .eq('provider_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log('Event already processed:', event.id);
    return;
  }

  const eventType = event.type;
  const data = event.data.object;

  switch (eventType) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(supabase, data, event.id);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(supabase, data, event.id, 'updated');
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(supabase, data, event.id);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(supabase, data, event.id);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(supabase, data, event.id);
      break;

    case 'customer.subscription.trial_will_end':
      // Can trigger notification email
      console.log('Trial ending soon for:', data.customer);
      break;

    default:
      console.log('Unhandled event type:', eventType);
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(supabase: any, session: any, eventId: string) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const clientReferenceId = session.client_reference_id; // user_id

  if (!clientReferenceId) {
    console.error('No user ID in checkout session');
    return;
  }

  // Fetch full subscription details
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`
      }
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch subscription from Stripe');
    return;
  }

  const subscription = await response.json();
  const tier = mapStripePriceToTier(subscription.items?.data[0]?.price?.id);
  const status = subscription.status === 'trialing' ? 'trialing' : 'active';

  // Get or create subscription
  await supabase.rpc('get_or_create_subscription', { target_user_id: clientReferenceId });

  // Update subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', clientReferenceId)
    .single();

  const previousTier = existingSub?.tier || 'free';

  await supabase
    .from('subscriptions')
    .update({
      tier,
      status,
      source: 'stripe',
      provider_subscription_id: subscriptionId,
      provider_customer_id: customerId,
      start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      amount_cents: subscription.items?.data[0]?.price?.unit_amount || 0,
      currency: subscription.currency?.toUpperCase(),
      billing_interval: subscription.items?.data[0]?.price?.recurring?.interval || 'monthly',
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', clientReferenceId);

  // Log event
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: clientReferenceId,
      event_type: status === 'trialing' ? 'trial_started' : 'subscription_activated',
      previous_tier: previousTier,
      new_tier: tier,
      amount_cents: session.amount_total,
      currency: session.currency?.toUpperCase(),
      source: 'stripe',
      provider_event_id: eventId,
      metadata: { session, subscription }
    });
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(supabase: any, subscription: any, eventId: string, action: string) {
  const customerId = subscription.customer;
  
  // Find user by Stripe customer ID
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('provider_customer_id', customerId)
    .maybeSingle();

  if (!existingSub) {
    console.log('No subscription found for customer:', customerId);
    return;
  }

  const userId = existingSub.user_id;
  const previousTier = existingSub.tier;
  const tier = mapStripePriceToTier(subscription.items?.data[0]?.price?.id);
  const status = subscription.status;

  await supabase
    .from('subscriptions')
    .update({
      tier,
      status: mapStripeStatus(status),
      renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Determine event type
  let eventType = 'subscription_renewed';
  if (previousTier !== tier) {
    eventType = tier > previousTier ? 'subscription_upgraded' : 'subscription_downgraded';
  }

  // Log event
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      event_type: eventType,
      previous_tier: previousTier,
      new_tier: tier,
      source: 'stripe',
      provider_event_id: eventId,
      metadata: { subscription }
    });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(supabase: any, subscription: any, eventId: string) {
  const customerId = subscription.customer;
  
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('provider_customer_id', customerId)
    .maybeSingle();

  if (!existingSub) {
    return;
  }

  const userId = existingSub.user_id;
  const previousTier = existingSub.tier;

  await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      event_type: 'subscription_canceled',
      previous_tier: previousTier,
      new_tier: 'free',
      source: 'stripe',
      provider_event_id: eventId,
      metadata: { subscription }
    });
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(supabase: any, invoice: any, eventId: string) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // One-time payment
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (!existingSub) {
    return;
  }

  // Update last validated
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', existingSub.user_id);

  // Log payment
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: existingSub.user_id,
      event_type: 'payment_succeeded',
      new_tier: existingSub.tier,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency?.toUpperCase(),
      source: 'stripe',
      provider_event_id: eventId,
      metadata: { invoice }
    });
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(supabase: any, invoice: any, eventId: string) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (!existingSub) {
    return;
  }

  // Mark as past due
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', existingSub.user_id);

  // Log failure
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: existingSub.user_id,
      event_type: 'payment_failed',
      new_tier: existingSub.tier,
      amount_cents: invoice.amount_due,
      currency: invoice.currency?.toUpperCase(),
      source: 'stripe',
      provider_event_id: eventId,
      metadata: { invoice }
    });
}

/**
 * Map Stripe price ID to tier
 */
function mapStripePriceToTier(priceId?: string): string {
  const premiumPriceId = Deno.env.get('STRIPE_PRICE_ID_PREMIUM');
  const coachPriceId = Deno.env.get('STRIPE_PRICE_ID_COACH');

  if (priceId === coachPriceId) return 'coach_plus';
  if (priceId === premiumPriceId) return 'premium';
  return 'free';
}

/**
 * Map Stripe status to our status
 */
function mapStripeStatus(status: string): string {
  const mapping: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'expired',
    'incomplete': 'past_due',
    'incomplete_expired': 'expired'
  };
  return mapping[status] || 'canceled';
}
