import { supabase } from '@/integrations/supabase/client';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export interface CheckoutOptions {
  tier: 'premium' | 'coach_plus';
  isAnnual?: boolean;
  trialDays?: number;
  couponCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(options: CheckoutOptions): Promise<string | null> {
  try {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.error('Stripe not configured');
      throw new Error('Payment system not configured. Please contact support.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Must be logged in to subscribe');
    }

    const priceId = getPriceId(options.tier, options.isAnnual);
    const successUrl = options.successUrl || `${window.location.origin}/settings?tab=subscription&success=true`;
    const cancelUrl = options.cancelUrl || `${window.location.origin}/settings?tab=subscription&canceled=true`;

    const params = new URLSearchParams({
      price_id: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email || '',
      trial_days: (options.trialDays || 7).toString()
    });

    if (options.couponCode) {
      params.append('coupon_code', options.couponCode);
    }

    const checkoutUrl = `https://buy.stripe.com/test_placeholder?${params.toString()}`;

    return checkoutUrl;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(): Promise<string | null> {
  try {
    if (!STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Payment system not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Must be logged in');
    }

    const returnUrl = `${window.location.origin}/settings?tab=subscription`;

    const portalUrl = `https://billing.stripe.com/session/placeholder?return_url=${encodeURIComponent(returnUrl)}`;

    return portalUrl;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

function getPriceId(tier: 'premium' | 'coach_plus', isAnnual?: boolean): string {
  const priceIds = {
    premium_monthly: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM_MONTHLY || 'price_premium_monthly',
    premium_annual: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM_ANNUAL || 'price_premium_annual',
    coach_monthly: import.meta.env.VITE_STRIPE_PRICE_ID_COACH_MONTHLY || 'price_coach_monthly',
    coach_annual: import.meta.env.VITE_STRIPE_PRICE_ID_COACH_ANNUAL || 'price_coach_annual',
  };

  if (tier === 'premium') {
    return isAnnual ? priceIds.premium_annual : priceIds.premium_monthly;
  } else {
    return isAnnual ? priceIds.coach_annual : priceIds.coach_monthly;
  }
}

export function formatPrice(tier: 'premium' | 'coach_plus', isAnnual?: boolean): string {
  const prices = {
    premium_monthly: '$9.99/month',
    premium_annual: '$99/year',
    coach_monthly: '$29.99/month',
    coach_annual: '$299/year',
  };

  if (tier === 'premium') {
    return isAnnual ? prices.premium_annual : prices.premium_monthly;
  } else {
    return isAnnual ? prices.coach_annual : prices.coach_monthly;
  }
}
