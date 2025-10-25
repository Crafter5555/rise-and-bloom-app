# Subscription System - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Protect a Feature (2 minutes)

```tsx
import { useEntitlementGate } from '@/hooks/useEntitlementGate';
import { PaywallModal } from '@/components/subscription/PaywallModal';

export function MyPremiumFeature() {
  const {
    hasAccess,
    showPaywall,
    setShowPaywall,
    featureName,
    requiredTier
  } = useEntitlementGate('ai_insights'); // or 'advanced_analytics', 'coach_sessions', etc.

  if (!hasAccess) {
    return (
      <>
        <div onClick={() => setShowPaywall(true)}>
          Feature Locked - Click to Upgrade
        </div>
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          featureName={featureName}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  return <ActualFeatureContent />;
}
```

### Step 2: Show Subscription Status (1 minute)

```tsx
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionBadge() {
  const { tier, isTrial, isPremium } = useSubscription();

  return (
    <div>
      Current Plan: {tier}
      {isTrial && ' (Trial)'}
      {isPremium && ' ⭐'}
    </div>
  );
}
```

### Step 3: Configure Payment (2 minutes)

1. Add to Supabase Dashboard → Settings → Edge Functions → Secrets:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_COACH_MONTHLY=price_...
```

2. Add to `.env.local`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Register webhook in Stripe Dashboard:
```
https://[your-project].supabase.co/functions/v1/stripe-webhook
```

**Done!** 🎉

---

## 📋 Available Feature Keys

Use these keys with `useEntitlementGate()`:

### Free Tier
- `basic_planner` ✅
- `basic_stats` ✅
- `morning_evening_check` ✅
- `basic_journaling` ✅

### Premium Tier
- `ai_insights` 🔒
- `journeys` 🔒
- `media_library` 🔒
- `advanced_analytics` 🔒
- `digital_wellbeing` 🔒
- `group_challenges` 🔒

### Coach+ Tier
- `coach_sessions` 🔒👑
- `priority_support` 🔒👑

---

## 🎨 Pre-Built Components

### 1. Full Feature Gate
```tsx
import { AIInsightsFeatureGate } from '@/components/subscription/FeatureGateExample';

<AIInsightsFeatureGate>
  <YourPremiumContent />
</AIInsightsFeatureGate>
```

### 2. Paywall Modal Only
```tsx
import { PaywallModal } from '@/components/subscription/PaywallModal';

<PaywallModal
  open={open}
  onOpenChange={setOpen}
  featureName="AI Insights"
  requiredTier="premium"
/>
```

### 3. Inline Access Check
```tsx
const { requireAccess } = useEntitlementGate('advanced_analytics');

function handleExport() {
  if (!requireAccess('write')) return; // Shows paywall
  exportData();
}
```

---

## 💰 Points Redemption

### Get Available Coupons
```tsx
import { getAvailableCoupons } from '@/utils/subscription';

const coupons = await getAvailableCoupons();
// [{ id, points_required, discount_value, ... }]
```

### Redeem Coupon
```tsx
import { redeemSubscriptionCoupon } from '@/utils/subscription';

const result = await redeemSubscriptionCoupon(couponId);
if (result.success) {
  console.log('Discount code:', result.discountCode);
}
```

### Check Points Balance
```tsx
import { getPointsBalance } from '@/utils/subscription';

const balance = await getPointsBalance();
console.log('Available points:', balance);
```

---

## 🔄 Subscription Management

### Force Refresh Subscription
```tsx
const { validateSubscription } = useSubscription();
await validateSubscription(true); // force refresh from Stripe/RevenueCat
```

### Get Subscription History
```tsx
import { getSubscriptionHistory } from '@/utils/subscription';

const history = await getSubscriptionHistory();
// [{ event_type, timestamp, previous_tier, new_tier, ... }]
```

### Create Checkout Session
```tsx
import { createCheckoutSession } from '@/utils/stripe';

const url = await createCheckoutSession({
  tier: 'premium',
  isAnnual: false,
  trialDays: 7
});

window.location.href = url;
```

---

## 🧪 Testing Locally

### Test Free User
```typescript
// User will be on free tier by default
// Access basic features, see paywall on premium features
```

### Test Premium Trial
```typescript
// Option 1: Redeem 500 points for trial
await redeemSubscriptionCoupon(trialCouponId);

// Option 2: Manually update in Supabase dashboard
// subscriptions table: set status='trialing', tier='premium'
```

### Test Webhook (Development)
```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to https://[project].supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

---

## 📊 Database Queries

### Check User's Tier
```sql
SELECT tier, status FROM subscriptions WHERE user_id = 'user-uuid';
```

### View All Entitlements
```sql
SELECT tier, feature_key, access_level
FROM entitlements
WHERE tier = 'premium'
ORDER BY feature_key;
```

### Recent Subscription Events
```sql
SELECT event_type, timestamp, previous_tier, new_tier
FROM subscription_audit_log
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 10;
```

### Available Coupons
```sql
SELECT
  metadata->>'name' as name,
  points_required,
  discount_type,
  discount_value
FROM subscription_coupons
WHERE is_active = true
ORDER BY points_required;
```

---

## 🐛 Troubleshooting

### Issue: Feature always locked
```typescript
// Check current subscription
const { subscription } = useSubscription();
console.log('Subscription:', subscription);

// Check feature entitlement
const { data } = await supabase
  .from('entitlements')
  .select('*')
  .eq('tier', subscription.tier)
  .eq('feature_key', 'ai_insights');
console.log('Entitlement:', data);
```

### Issue: Webhook not working
```bash
# Check Edge Function logs
# Supabase Dashboard → Edge Functions → stripe-webhook → Logs

# Verify signature secret matches
# Compare STRIPE_WEBHOOK_SECRET in Supabase with Stripe Dashboard
```

### Issue: Points not deducting
```sql
-- Check points system exists
SELECT * FROM user_points_cache WHERE user_id = 'user-uuid';

-- If null, initialize:
SELECT refresh_user_points_cache('user-uuid');
```

---

## 🎯 Common Patterns

### Pattern 1: Progressive Feature Lock
```tsx
function AdvancedChart() {
  const { canRead, canWrite } = useEntitlementGate('advanced_analytics');

  return (
    <div>
      {canRead && <BasicChart />}
      {canWrite && <ExportButton />}
    </div>
  );
}
```

### Pattern 2: Soft Paywall
```tsx
function ContentPreview() {
  const { hasAccess } = useEntitlementGate('media_library');

  return (
    <div>
      <ContentCard item={items[0]} />
      {!hasAccess && (
        <>
          <BlurredContent items={items.slice(1)} />
          <UpgradePrompt />
        </>
      )}
      {hasAccess && items.slice(1).map(item => <ContentCard item={item} />)}
    </div>
  );
}
```

### Pattern 3: Usage Quota
```tsx
function CoachSessionBooking() {
  const { hasAccess } = useEntitlementGate('coach_sessions');

  // Check remaining quota from entitlement.usage_limit
  // Display: "2 of 4 sessions remaining this month"

  return hasAccess ? <BookingForm /> : <UpgradePrompt />;
}
```

---

## 📚 API Reference

### useSubscription()
```typescript
{
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;        // active or trialing
  isPremium: boolean;       // premium or coach_plus
  isCoachPlus: boolean;     // coach_plus only
  isTrial: boolean;         // status === 'trialing'
  tier: 'free' | 'premium' | 'coach_plus';
  validateSubscription: (force?: boolean) => Promise<any>;
  refreshSubscription: () => Promise<void>;
}
```

### useEntitlementGate(featureKey)
```typescript
{
  hasAccess: boolean;
  accessLevel: 'none' | 'read' | 'write' | 'full';
  currentTier: string;
  requiredTier?: string;
  featureName?: string;
  loading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  requireAccess: (level?: 'read'|'write'|'full') => boolean;
  canRead: boolean;
  canWrite: boolean;
  canFull: boolean;
}
```

---

## 🎁 Ready-to-Use Coupons

| Name | Points | Type | Value |
|------|--------|------|-------|
| 7-Day Trial | 500 | Trial Extension | 7 days |
| 25% Off First Month | 1,000 | Percentage | 25% |
| 50% Off First Month | 2,500 | Percentage | 50% |
| $5 Off Any Plan | 3,000 | Fixed Amount | $5 |
| 1 Month Coach+ Free | 5,000 | Tier Upgrade | 1 month |

---

## ✅ Launch Checklist

- [ ] Configure Stripe API keys
- [ ] Set up Stripe products and prices
- [ ] Register Stripe webhook
- [ ] Test webhook delivery
- [ ] Configure RevenueCat (for mobile)
- [ ] Test points redemption flow
- [ ] Verify feature gates work correctly
- [ ] Test trial expiration
- [ ] Add subscription tab to Settings page
- [ ] Set up analytics monitoring
- [ ] Document pricing for users
- [ ] Train support team

---

**Need Help?**
- Check `MONETIZATION_SYSTEM_SUMMARY.md` for detailed documentation
- Review Edge Function logs in Supabase Dashboard
- Test with Stripe test mode before going live
- Monitor `subscription_audit_log` for all events
