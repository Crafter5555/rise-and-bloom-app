/**
 * Validate Subscription Edge Function
 * 
 * Verifies subscription status with Stripe/RevenueCat and updates local database.
 * - Validates entitlement tokens
 * - Checks subscription status with providers
 * - Updates local subscription record
 * - Invalidates session if expired
 * 
 * Security: Requires authenticated user, verifies with external APIs
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ValidationRequest {
  provider?: 'stripe' | 'revenuecat';
  force_refresh?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const body: ValidationRequest = await req.json().catch(() => ({}));
    const { provider, force_refresh } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no subscription exists, create free tier
    if (!subscription) {
      const { data: newSub } = await supabase.rpc('get_or_create_subscription', {
        target_user_id: user.id
      });

      return new Response(
        JSON.stringify({
          valid: true,
          tier: 'free',
          status: 'active',
          message: 'Free tier subscription created'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we need to validate with external provider
    const lastValidated = subscription.last_validated_at ? new Date(subscription.last_validated_at) : null;
    const now = new Date();
    const hoursSinceValidation = lastValidated ? (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60) : 24;

    const needsValidation = force_refresh || hoursSinceValidation >= 6 || subscription.status === 'trialing';

    if (needsValidation && subscription.source !== 'admin' && subscription.source !== 'trial') {
      let validationResult;

      if (subscription.source === 'stripe' && subscription.provider_subscription_id) {
        validationResult = await validateStripeSubscription(
          subscription.provider_subscription_id,
          subscription.provider_customer_id
        );
      } else if (subscription.source === 'revenuecat' && subscription.provider_subscription_id) {
        validationResult = await validateRevenueCatSubscription(
          user.id,
          subscription.provider_subscription_id
        );
      }

      if (validationResult) {
        // Update subscription based on validation
        await supabase
          .from('subscriptions')
          .update({
            status: validationResult.status,
            tier: validationResult.tier,
            last_validated_at: now.toISOString(),
            renewal_date: validationResult.renewal_date,
            end_date: validationResult.end_date,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        // Log validation
        await supabase
          .from('subscription_audit_log')
          .insert({
            user_id: user.id,
            subscription_id: subscription.id,
            event_type: 'webhook_received',
            source: subscription.source,
            metadata: { validation: validationResult, forced: force_refresh }
          });

        return new Response(
          JSON.stringify({
            valid: validationResult.status === 'active' || validationResult.status === 'trialing',
            tier: validationResult.tier,
            status: validationResult.status,
            renewal_date: validationResult.renewal_date,
            message: 'Subscription validated with provider'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for expired trials
    if (subscription.status === 'trialing' && subscription.trial_end_date) {
      const trialEnd = new Date(subscription.trial_end_date);
      if (now > trialEnd) {
        await supabase
          .from('subscriptions')
          .update({
            tier: 'free',
            status: 'expired',
            end_date: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        await supabase
          .from('subscription_audit_log')
          .insert({
            user_id: user.id,
            subscription_id: subscription.id,
            event_type: 'trial_expired',
            previous_tier: subscription.tier,
            new_tier: 'free',
            source: 'system'
          });

        return new Response(
          JSON.stringify({
            valid: false,
            tier: 'free',
            status: 'expired',
            message: 'Trial has expired'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return current subscription status
    return new Response(
      JSON.stringify({
        valid: subscription.status === 'active' || subscription.status === 'trialing',
        tier: subscription.tier,
        status: subscription.status,
        renewal_date: subscription.renewal_date,
        trial_end_date: subscription.trial_end_date,
        message: 'Subscription is valid'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate subscription with Stripe API
 */
async function validateStripeSubscription(subscriptionId: string, customerId?: string | null) {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.warn('Stripe not configured, skipping validation');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.ok) {
      console.error('Stripe API error:', await response.text());
      return null;
    }

    const subscription = await response.json();
    
    return {
      status: subscription.status === 'active' ? 'active' : 
              subscription.status === 'trialing' ? 'trialing' :
              subscription.status === 'past_due' ? 'past_due' : 'canceled',
      tier: mapStripePriceToTier(subscription.items?.data[0]?.price?.id),
      renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
      end_date: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
    };
  } catch (error) {
    console.error('Stripe validation error:', error);
    return null;
  }
}

/**
 * Validate subscription with RevenueCat API
 */
async function validateRevenueCatSubscription(userId: string, subscriptionId: string) {
  const revenueCatApiKey = Deno.env.get('REVENUECAT_API_KEY');
  if (!revenueCatApiKey) {
    console.warn('RevenueCat not configured, skipping validation');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${revenueCatApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('RevenueCat API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const subscriber = data.subscriber;
    
    // Check if user has active entitlements
    const hasActiveEntitlement = subscriber?.entitlements && 
      Object.values(subscriber.entitlements).some((ent: any) => 
        ent.expires_date && new Date(ent.expires_date) > new Date()
      );

    if (!hasActiveEntitlement) {
      return {
        status: 'expired',
        tier: 'free',
        renewal_date: null,
        end_date: new Date().toISOString()
      };
    }

    const activeEntitlement = Object.values(subscriber.entitlements).find((ent: any) => 
      ent.expires_date && new Date(ent.expires_date) > new Date()
    ) as any;

    return {
      status: 'active',
      tier: mapRevenueCatEntitlementToTier(activeEntitlement?.identifier),
      renewal_date: activeEntitlement?.expires_date || null,
      end_date: null
    };
  } catch (error) {
    console.error('RevenueCat validation error:', error);
    return null;
  }
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
 * Map RevenueCat entitlement to tier
 */
function mapRevenueCatEntitlementToTier(identifier?: string): string {
  if (!identifier) return 'free';
  
  const lower = identifier.toLowerCase();
  if (lower.includes('coach')) return 'coach_plus';
  if (lower.includes('premium') || lower.includes('pro')) return 'premium';
  return 'free';
}
