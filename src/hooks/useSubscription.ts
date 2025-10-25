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

    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setSubscription(payload.new as Subscription);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  async function fetchSubscription() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        const { data: created } = await supabase.rpc('get_or_create_subscription', {
          target_user_id: user.id
        });

        const { data: newSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setSubscription(newSub);
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }

  async function validateSubscription(forceRefresh = false) {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('validate-subscription', {
        body: { force_refresh: forceRefresh }
      });

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

  return {
    subscription,
    loading,
    error,
    isActive,
    isPremium,
    isCoachPlus,
    isTrial,
    tier: subscription?.tier || 'free',
    validateSubscription,
    refreshSubscription: fetchSubscription
  };
}
