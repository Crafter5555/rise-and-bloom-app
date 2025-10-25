import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

export interface FeatureAccess {
  hasAccess: boolean;
  accessLevel: 'none' | 'read' | 'write' | 'full';
  currentTier: 'free' | 'premium' | 'coach_plus';
  requiredTier?: string;
  featureName?: string;
}

export function useEntitlementGate(featureKey: string) {
  const { subscription, tier, loading: subscriptionLoading } = useSubscription();
  const [access, setAccess] = useState<FeatureAccess>({
    hasAccess: false,
    accessLevel: 'none',
    currentTier: 'free'
  });
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (subscriptionLoading) return;
    checkAccess();
  }, [featureKey, tier, subscriptionLoading]);

  async function checkAccess() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('entitlements')
        .select('*')
        .eq('tier', tier)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (error) throw error;

      const hasAccess = data ? data.access_level !== 'none' : false;
      const accessLevel = data?.access_level || 'none';

      const requiredTierData = await supabase
        .from('entitlements')
        .select('tier, feature_name')
        .eq('feature_key', featureKey)
        .neq('access_level', 'none')
        .order('tier', { ascending: true })
        .limit(1)
        .maybeSingle();

      setAccess({
        hasAccess,
        accessLevel,
        currentTier: tier,
        requiredTier: requiredTierData.data?.tier,
        featureName: requiredTierData.data?.feature_name || featureKey
      });
    } catch (err) {
      console.error('Error checking feature access:', err);
      setAccess({
        hasAccess: false,
        accessLevel: 'none',
        currentTier: tier
      });
    } finally {
      setLoading(false);
    }
  }

  const requireAccess = useCallback((accessLevel: 'read' | 'write' | 'full' = 'read'): boolean => {
    const levels = { none: 0, read: 1, write: 2, full: 3 };
    const userLevel = levels[access.accessLevel];
    const requiredLevel = levels[accessLevel];

    const hasRequiredAccess = userLevel >= requiredLevel;

    if (!hasRequiredAccess) {
      setShowPaywall(true);
    }

    return hasRequiredAccess;
  }, [access.accessLevel]);

  const canRead = access.accessLevel !== 'none';
  const canWrite = access.accessLevel === 'write' || access.accessLevel === 'full';
  const canFull = access.accessLevel === 'full';

  return {
    hasAccess: access.hasAccess,
    accessLevel: access.accessLevel,
    currentTier: access.currentTier,
    requiredTier: access.requiredTier,
    featureName: access.featureName,
    loading,
    showPaywall,
    setShowPaywall,
    requireAccess,
    canRead,
    canWrite,
    canFull
  };
}

export function useMultipleEntitlements(featureKeys: string[]) {
  const { tier, loading: subscriptionLoading } = useSubscription();
  const [entitlements, setEntitlements] = useState<Record<string, FeatureAccess>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subscriptionLoading) return;
    checkMultipleAccess();
  }, [featureKeys, tier, subscriptionLoading]);

  async function checkMultipleAccess() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('entitlements')
        .select('*')
        .eq('tier', tier)
        .in('feature_key', featureKeys);

      if (error) throw error;

      const accessMap: Record<string, FeatureAccess> = {};

      for (const key of featureKeys) {
        const entitlement = data?.find(e => e.feature_key === key);
        const hasAccess = entitlement ? entitlement.access_level !== 'none' : false;

        accessMap[key] = {
          hasAccess,
          accessLevel: entitlement?.access_level || 'none',
          currentTier: tier,
          featureName: entitlement?.feature_name || key
        };
      }

      setEntitlements(accessMap);
    } catch (err) {
      console.error('Error checking multiple feature access:', err);
    } finally {
      setLoading(false);
    }
  }

  return { entitlements, loading, refresh: checkMultipleAccess };
}
