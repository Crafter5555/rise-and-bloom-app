import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  tier: 'free' | 'premium' | 'coach_plus';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'paused';
  start_date: string;
  end_date?: string | null;
  renewal_date?: string | null;
  trial_end_date?: string | null;
  cancel_at_period_end: boolean;
  source: 'stripe' | 'revenuecat' | 'coupon' | 'admin' | 'trial';
}

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'default',
  tier: 'free',
  status: 'active',
  start_date: new Date().toISOString(),
  cancel_at_period_end: false,
  source: 'admin'
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    fetchSubscription();
  }, [user]);

  async function fetchSubscription() {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSubscription(data ? (data as Subscription) : DEFAULT_SUBSCRIPTION);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setSubscription(DEFAULT_SUBSCRIPTION);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }

  async function validateSubscription(forceRefresh = false) {
    if (!user) return null;
    try {
      const { data, error } = await supabase.functions.invoke('validate-subscription', { body: { force_refresh: forceRefresh } });
      if (error) throw error;
      await fetchSubscription();
      return data;
    } catch (err) {
      console.error('Error validating subscription:', err);
      throw err;
    }
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPremium = isActive && (subscription?.tier === 'premium' || subscription?.tier === 'coach_plus');
  const isCoachPlus = isActive && subscription?.tier === 'coach_plus';
  const isTrial = subscription?.status === 'trialing';

  return { subscription, loading, error, isActive, isPremium, isCoachPlus, isTrial, tier: (subscription?.tier || 'free') as 'free' | 'premium' | 'coach_plus', validateSubscription, refreshSubscription: fetchSubscription };
}
