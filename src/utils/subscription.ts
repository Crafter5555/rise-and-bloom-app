import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionCoupon {
  id: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_trial_extension' | 'tier_upgrade';
  discount_value: number;
  applicable_tiers: string[];
  points_required: number;
  metadata: {
    name: string;
    description: string;
  };
}

export async function getAvailableCoupons(): Promise<SubscriptionCoupon[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_coupons')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

export async function redeemSubscriptionCoupon(couponId: string): Promise<{
  success: boolean;
  discountCode?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('redeem-points-for-subscription', {
      body: { coupon_id: couponId }
    });

    if (error) throw error;

    return {
      success: true,
      discountCode: data.discount_code,
      message: data.message
    };
  } catch (error: any) {
    console.error('Error redeeming coupon:', error);
    return {
      success: false,
      error: error.message || 'Failed to redeem coupon'
    };
  }
}

export async function getPointsBalance(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('user_points_cache')
      .select('available_points')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching points:', error);
      return 0;
    }

    return data?.available_points || 0;
  } catch (error) {
    console.error('Error getting points balance:', error);
    return 0;
  }
}

export async function getSubscriptionAnalytics() {
  try {
    const { data, error } = await supabase
      .from('subscription_analytics')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(12);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
}

export async function getSubscriptionHistory() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('subscription_audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return [];
  }
}

export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    'free': 'Free',
    'premium': 'Premium',
    'coach_plus': 'Coach+'
  };
  return names[tier] || tier;
}

export function getStatusDisplayName(status: string): string {
  const names: Record<string, string> = {
    'active': 'Active',
    'trialing': 'Trial',
    'past_due': 'Past Due',
    'canceled': 'Canceled',
    'expired': 'Expired',
    'paused': 'Paused'
  };
  return names[status] || status;
}

export function canUpgradeTo(currentTier: string, targetTier: string): boolean {
  const tierOrder = { 'free': 0, 'premium': 1, 'coach_plus': 2 };
  return tierOrder[currentTier as keyof typeof tierOrder] < tierOrder[targetTier as keyof typeof tierOrder];
}

export function canDowngradeTo(currentTier: string, targetTier: string): boolean {
  const tierOrder = { 'free': 0, 'premium': 1, 'coach_plus': 2 };
  return tierOrder[currentTier as keyof typeof tierOrder] > tierOrder[targetTier as keyof typeof tierOrder];
}
