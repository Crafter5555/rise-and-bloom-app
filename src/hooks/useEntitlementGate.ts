import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './useSubscription';

export interface FeatureAccess {
  hasAccess: boolean;
  accessLevel: 'none' | 'read' | 'write' | 'full';
  currentTier: 'free' | 'premium' | 'coach_plus';
  requiredTier?: string;
  featureName?: string;
}

// Local entitlement definitions since the table may not exist
const ENTITLEMENTS: Record<string, Record<string, { access_level: string; feature_name: string }>> = {
  free: {
    basic_habits: { access_level: 'full', feature_name: 'Basic Habits' },
    basic_tasks: { access_level: 'full', feature_name: 'Basic Tasks' },
    basic_journal: { access_level: 'write', feature_name: 'Basic Journal' },
    ai_coach: { access_level: 'read', feature_name: 'AI Life Coach' },
    insights: { access_level: 'read', feature_name: 'Insights' },
  },
  premium: {
    basic_habits: { access_level: 'full', feature_name: 'Basic Habits' },
    basic_tasks: { access_level: 'full', feature_name: 'Basic Tasks' },
    basic_journal: { access_level: 'full', feature_name: 'Basic Journal' },
    ai_coach: { access_level: 'full', feature_name: 'AI Life Coach' },
    insights: { access_level: 'full', feature_name: 'Insights' },
    advanced_analytics: { access_level: 'full', feature_name: 'Advanced Analytics' },
    guided_journeys: { access_level: 'full', feature_name: 'Guided Journeys' },
  },
  coach_plus: {
    basic_habits: { access_level: 'full', feature_name: 'Basic Habits' },
    basic_tasks: { access_level: 'full', feature_name: 'Basic Tasks' },
    basic_journal: { access_level: 'full', feature_name: 'Basic Journal' },
    ai_coach: { access_level: 'full', feature_name: 'AI Life Coach' },
    insights: { access_level: 'full', feature_name: 'Insights' },
    advanced_analytics: { access_level: 'full', feature_name: 'Advanced Analytics' },
    guided_journeys: { access_level: 'full', feature_name: 'Guided Journeys' },
    priority_support: { access_level: 'full', feature_name: 'Priority Support' },
  },
};

function getEntitlement(tier: string, featureKey: string) {
  const tierEntitlements = ENTITLEMENTS[tier] || ENTITLEMENTS.free;
  return tierEntitlements[featureKey] || null;
}

function getRequiredTier(featureKey: string): { tier: string; feature_name: string } | null {
  for (const tier of ['free', 'premium', 'coach_plus']) {
    const entitlement = ENTITLEMENTS[tier]?.[featureKey];
    if (entitlement && entitlement.access_level !== 'none') {
      return { tier, feature_name: entitlement.feature_name };
    }
  }
  return null;
}

export function useEntitlementGate(featureKey: string) {
  const { tier, loading: subscriptionLoading } = useSubscription();
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

  function checkAccess() {
    setLoading(true);

    const entitlement = getEntitlement(tier, featureKey);
    const hasAccess = entitlement ? entitlement.access_level !== 'none' : false;
    const accessLevel = (entitlement?.access_level || 'none') as FeatureAccess['accessLevel'];

    const requiredTierData = getRequiredTier(featureKey);

    setAccess({
      hasAccess,
      accessLevel,
      currentTier: tier,
      requiredTier: requiredTierData?.tier,
      featureName: requiredTierData?.feature_name || featureKey
    });

    setLoading(false);
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

  function checkMultipleAccess() {
    setLoading(true);

    const accessMap: Record<string, FeatureAccess> = {};

    for (const key of featureKeys) {
      const entitlement = getEntitlement(tier, key);
      const hasAccess = entitlement ? entitlement.access_level !== 'none' : false;

      accessMap[key] = {
        hasAccess,
        accessLevel: (entitlement?.access_level || 'none') as FeatureAccess['accessLevel'],
        currentTier: tier,
        featureName: entitlement?.feature_name || key
      };
    }

    setEntitlements(accessMap);
    setLoading(false);
  }

  return { entitlements, loading, refresh: checkMultipleAccess };
}
