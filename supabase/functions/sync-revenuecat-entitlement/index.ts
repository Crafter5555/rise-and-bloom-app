/**
 * Sync RevenueCat Entitlement Edge Function
 * 
 * Syncs mobile app purchases from RevenueCat to local database.
 * - Verifies RevenueCat webhook signature
 * - Updates subscription tier based on entitlements
 * - Logs all subscription events
 * - Handles renewals, cancellations, and refunds
 * 
 * Security: Webhook signature verification, idempotent processing
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-RevenueCat-Signature',
};

interface RevenueCatWebhook {
  event: {
    type: string;
    id: string;
    app_user_id: string;
    product_id?: string;
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    store?: string;
    price_in_purchased_currency?: number;
    currency?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const revenueCatWebhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    
    // Verify webhook signature if secret is configured
    if (revenueCatWebhookSecret) {
      const signature = req.headers.get('X-RevenueCat-Signature');
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'Missing webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.text();
      const isValid = await verifyRevenueCatSignature(body, signature, revenueCatWebhookSecret);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const webhook: RevenueCatWebhook = JSON.parse(body);
      return await processRevenueCatWebhook(webhook);
    }

    // If no signature verification, treat as manual sync request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { entitlement_data } = body;

    if (!entitlement_data) {
      return new Response(
        JSON.stringify({ error: 'Missing entitlement_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return await syncUserEntitlement(user.id, entitlement_data);

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process RevenueCat webhook event
 */
async function processRevenueCatWebhook(webhook: RevenueCatWebhook) {
  const { event } = webhook;
  const userId = event.app_user_id;

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
    return new Response(
      JSON.stringify({ message: 'Event already processed', event_id: event.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Map event type to our system
  const eventMapping: Record<string, string> = {
    'INITIAL_PURCHASE': 'subscription_activated',
    'RENEWAL': 'subscription_renewed',
    'CANCELLATION': 'subscription_canceled',
    'UNCANCELLATION': 'subscription_resumed',
    'NON_RENEWING_PURCHASE': 'subscription_activated',
    'EXPIRATION': 'subscription_expired',
    'BILLING_ISSUE': 'payment_failed',
    'PRODUCT_CHANGE': 'subscription_upgraded',
  };

  const eventType = eventMapping[event.type] || 'webhook_received';
  const tier = mapRevenueCatProductToTier(event.product_id);

  // Get or create subscription
  let { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!subscription) {
    await supabase.rpc('get_or_create_subscription', { target_user_id: userId });
    const { data: newSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    subscription = newSub;
  }

  const previousTier = subscription?.tier || 'free';

  // Update subscription based on event type
  if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'].includes(event.type)) {
    const renewalDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    
    await supabase
      .from('subscriptions')
      .update({
        tier,
        status: 'active',
        source: 'revenuecat',
        provider_subscription_id: event.id,
        renewal_date: renewalDate?.toISOString(),
        last_validated_at: new Date().toISOString(),
        cancel_at_period_end: false,
        amount_cents: event.price_in_purchased_currency ? Math.round(event.price_in_purchased_currency * 100) : null,
        currency: event.currency,
        billing_interval: event.period_type === 'TRIAL' ? 'monthly' : event.period_type?.toLowerCase() as any,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else if (event.type === 'CANCELLATION') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else if (event.type === 'EXPIRATION') {
    await supabase
      .from('subscriptions')
      .update({
        tier: 'free',
        status: 'expired',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  // Log event
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      subscription_id: subscription?.id,
      event_type: eventType,
      previous_tier: previousTier,
      new_tier: tier,
      amount_cents: event.price_in_purchased_currency ? Math.round(event.price_in_purchased_currency * 100) : null,
      currency: event.currency,
      source: 'revenuecat',
      provider_event_id: event.id,
      metadata: { webhook_event: event }
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Subscription synced successfully',
      tier,
      event_type: eventType
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Sync user entitlement from manual request
 */
async function syncUserEntitlement(userId: string, entitlementData: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const tier = mapRevenueCatEntitlementToTier(entitlementData.identifier || entitlementData.product_id);
  const expiresAt = entitlementData.expires_date || entitlementData.expiration_at_ms;
  const renewalDate = expiresAt ? new Date(expiresAt) : null;

  // Get or create subscription
  await supabase.rpc('get_or_create_subscription', { target_user_id: userId });

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      tier,
      status: 'active',
      source: 'revenuecat',
      renewal_date: renewalDate?.toISOString(),
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Entitlement synced successfully',
      tier
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Verify RevenueCat webhook signature
 */
async function verifyRevenueCatSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(
      signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Map RevenueCat product ID to tier
 */
function mapRevenueCatProductToTier(productId?: string): string {
  if (!productId) return 'free';
  
  const lower = productId.toLowerCase();
  if (lower.includes('coach')) return 'coach_plus';
  if (lower.includes('premium') || lower.includes('pro')) return 'premium';
  return 'free';
}

/**
 * Map RevenueCat entitlement to tier
 */
function mapRevenueCatEntitlementToTier(identifier?: string): string {
  if (!identifier) return 'free';
  
  const lower = identifier.toLowerCase();
  if (lower.includes('coach')) return 'coach_plus';
  if (lower.includes('premium') || lower.includes('pro')) return 'premium';
  return 'free';
}
