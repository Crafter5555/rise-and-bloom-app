# Subscription System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Paywall    │  │   Feature    │  │ Subscription │         │
│  │    Modal     │  │    Gates     │  │   Settings   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────┐
        │ useSubscription│      │useEntitlement│
        │     Hook       │      │   Gate Hook  │
        └───────┬────────┘      └──────┬───────┘
                │                      │
                └──────────┬───────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    SUPABASE CLIENT                              │
├──────────────────────────┼──────────────────────────────────────┤
│                          │                                       │
│   ┌──────────────────────▼───────────────┐                     │
│   │   Real-time Subscriptions Channel    │                     │
│   │   (Auto-updates on changes)          │                     │
│   └──────────────────┬───────────────────┘                     │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                SUPABASE BACKEND                                 │
├──────────────────────┼──────────────────────────────────────────┤
│                      │                                          │
│   ┌──────────────────▼─────────────┐                           │
│   │      DATABASE TABLES            │                           │
│   │                                 │                           │
│   │  • subscriptions                │                           │
│   │  • entitlements                 │                           │
│   │  • subscription_audit_log       │                           │
│   │  • subscription_coupons         │                           │
│   │  • subscription_analytics       │                           │
│   │                                 │                           │
│   │  [All protected by RLS]         │                           │
│   └─────────────────────────────────┘                           │
│                      │                                          │
│   ┌──────────────────▼─────────────┐                           │
│   │      EDGE FUNCTIONS             │                           │
│   │                                 │                           │
│   │  1. validate-subscription       │                           │
│   │  2. sync-revenuecat-entitlement │                           │
│   │  3. redeem-points-for-subscription                          │
│   │  4. stripe-webhook              │                           │
│   │                                 │                           │
│   └───┬─────────────┬───────────────┘                           │
│       │             │                                           │
└───────┼─────────────┼───────────────────────────────────────────┘
        │             │
        │             │
┌───────▼─────┐ ┌─────▼──────┐
│   Stripe    │ │ RevenueCat │
│   (Web)     │ │  (Mobile)  │
└─────────────┘ └────────────┘
```

---

## 🔄 Data Flow Diagrams

### Flow 1: User Upgrades to Premium (Web)

```
User clicks           →  PaywallModal        →  createCheckoutSession()
"Upgrade Now"            opens                   generates Stripe URL

                                                       ↓

Stripe Checkout      →  User completes        →  Stripe sends webhook
Page                    payment                   to Edge Function

                                                       ↓

stripe-webhook       →  Updates database      →  Real-time channel
Edge Function           subscriptions table       notifies frontend

                                                       ↓

useSubscription      →  Re-renders UI         →  Feature unlocks
hook updates            with new tier             automatically
```

### Flow 2: Mobile In-App Purchase (RevenueCat)

```
User purchases       →  RevenueCat           →  RevenueCat sends
in mobile app           processes IAP            webhook

                                                       ↓

sync-revenuecat-     →  Validates signature  →  Updates subscriptions
entitlement             and processes event      table in database

                                                       ↓

Next app launch      →  validate-subscription →  Syncs entitlements
or manual sync          Edge Function            from RevenueCat API
```

### Flow 3: Points Redemption for Discount

```
User selects         →  getAvailableCoupons()  →  Displays coupon
coupon from list        fetches options           options & points cost

                                                       ↓

User confirms        →  redeemSubscriptionCoupon() → Edge Function
redemption              invokes Edge Function        validates balance

                                                       ↓

Atomic transaction:  →  Creates Stripe coupon   →  Returns discount
1. Deduct points        2. Updates redemptions     code to user
3. Logs audit event     count

                                                       ↓

User uses code       →  Applies to Stripe       →  Reduced price
in checkout             checkout session           in payment
```

### Flow 4: Feature Access Check

```
Component mounts     →  useEntitlementGate()   →  Queries entitlements
with feature key        hook initializes          table for user's tier

                                                       ↓

Has access?          →  YES: Render feature    →  User enjoys feature
Check access_level      NO: Show locked state     Full functionality

                                                       ↓
                                                   (If NO)

User clicks          →  PaywallModal opens     →  Displays upgrade
"Unlock" prompt         with tier comparison      options & pricing
```

---

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: CLIENT-SIDE                                   │
│  • useEntitlementGate hook validates access             │
│  • PaywallModal blocks unauthorized UI                  │
│  • NOT relied upon for security (can be bypassed)       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  LAYER 2: ROW LEVEL SECURITY (RLS)                      │
│  • Database-level access control                        │
│  • Users can only read their own subscriptions          │
│  • Only service role can modify subscriptions           │
│  • Cannot be bypassed from client                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  LAYER 3: EDGE FUNCTIONS                                │
│  • Server-authoritative validation                      │
│  • Webhook signature verification                       │
│  • Idempotency checks                                   │
│  • Trust score validation                               │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  LAYER 4: EXTERNAL PROVIDERS                            │
│  • Stripe secure payment processing                     │
│  • RevenueCat receipt validation                        │
│  • PCI compliance handled externally                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌─────────────────┐
│  auth.users     │
│  (Supabase)     │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────────┐      1:N      ┌──────────────────────┐
│   subscriptions     ├──────────────►│ subscription_audit_  │
│                     │               │      log             │
│  • user_id (FK)     │               │                      │
│  • tier             │               │  • subscription_id   │
│  • status           │               │  • event_type        │
│  • start_date       │               │  • timestamp         │
│  • renewal_date     │               │  • metadata          │
│  • source           │               └──────────────────────┘
└──────┬──────────────┘
       │
       │ Calculated
       │   based on
       │
┌──────▼──────────────┐
│   entitlements      │      Referenced by
│                     ├─────────────────────┐
│  • tier             │                     │
│  • feature_key      │                     │
│  • access_level     │                     │
│  • usage_limit      │                     │
└─────────────────────┘                     │
                                            │
                                            ▼
                                ┌───────────────────┐
                                │  useEntitlement   │
                                │   Gate Hook       │
                                │  (Frontend)       │
                                └───────────────────┘

┌─────────────────────┐
│ subscription_       │
│    coupons          │      Redeemed via
│                     ├──────────────────────┐
│  • discount_type    │                      │
│  • discount_value   │                      ▼
│  • points_required  │           ┌──────────────────┐
│  • stripe_coupon_id │           │ redeem-points-   │
└─────────────────────┘           │ for-subscription │
                                  │  Edge Function   │
                                  └──────────────────┘

┌─────────────────────┐
│ subscription_       │
│    analytics        │      Aggregated from
│                     │◄──────────────────────┐
│  • period_start     │                       │
│  • mrr_cents        │               ┌───────┴────────┐
│  • trial_conversions│               │ subscription_  │
│  • churn_rate       │               │  audit_log     │
└─────────────────────┘               └────────────────┘
```

---

## 🔌 Integration Points

### Stripe Integration

```
┌──────────────────────────────────────────────┐
│            STRIPE WORKFLOW                   │
└──────────────────────────────────────────────┘

Frontend                  Stripe              Backend
   │                        │                    │
   │  createCheckoutSession │                    │
   ├───────────────────────►│                    │
   │                        │                    │
   │  Redirect to Checkout  │                    │
   │◄───────────────────────┤                    │
   │                        │                    │
   │  User completes payment│                    │
   ├───────────────────────►│                    │
   │                        │                    │
   │                        │  webhook event     │
   │                        ├───────────────────►│
   │                        │                    │
   │                        │  signature verified│
   │                        │  data validated    │
   │                        │  subscription      │
   │                        │  created/updated   │
   │                        │                    │
   │  real-time update      │                    │
   │◄───────────────────────┴────────────────────┤
   │                                             │
   │  Feature unlocks                            │
   ▼                                             ▼
```

### RevenueCat Integration

```
┌──────────────────────────────────────────────┐
│         REVENUECAT WORKFLOW                  │
└──────────────────────────────────────────────┘

Mobile App             RevenueCat           Backend
    │                      │                    │
    │  Purchase Product    │                    │
    ├─────────────────────►│                    │
    │                      │                    │
    │  Apple/Google IAP    │                    │
    │◄─────────────────────┤                    │
    │                      │                    │
    │  Receipt validated   │                    │
    ├─────────────────────►│                    │
    │                      │                    │
    │                      │  webhook event     │
    │                      ├───────────────────►│
    │                      │                    │
    │                      │  process event     │
    │                      │  update tier       │
    │                      │  log audit         │
    │                      │                    │
    │  App launch          │                    │
    ├──────────────────────┴────────────────────┤
    │  validateSubscription()                   │
    ├──────────────────────────────────────────►│
    │                                            │
    │  Current entitlements                     │
    │◄───────────────────────────────────────────┤
    ▼                                            ▼
```

---

## 🎭 State Management

### Subscription State Flow

```
┌─────────────────────────────────────────┐
│      APPLICATION LIFECYCLE              │
└─────────────────────────────────────────┘

App Start
   │
   ▼
┌──────────────────┐
│ useSubscription  │
│    initializes   │──► Fetch from DB
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  subscription =  │
│     null        │
│  loading = true │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Supabase query  │
│  subscriptions   │
│  WHERE user_id   │
└────────┬─────────┘
         │
         ▼
  ┌─────┴─────┐
  │  Found?   │
  └─────┬─────┘
   YES  │  NO
   ◄────┼────►
        │    Create free tier
        │    subscription
        ▼
┌──────────────────┐
│  subscription =  │
│     {data}      │
│  loading = false│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Subscribe to    │
│  real-time       │
│  changes         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  On change:      │
│  Update state    │
│  Re-render       │
└──────────────────┘
```

### Entitlement Check Flow

```
Component Render
   │
   ▼
┌──────────────────────┐
│ useEntitlementGate   │
│   ('ai_insights')    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Query entitlements   │
│ WHERE tier = current │
│   AND feature_key =  │
│      'ai_insights'   │
└──────────┬───────────┘
           │
           ▼
     ┌─────┴─────┐
     │ Has Access?│
     └─────┬─────┘
      YES  │  NO
      ◄────┼────►
           │     │
           │     ▼
           │  ┌──────────────┐
           │  │ Show paywall │
           │  │  or locked   │
           │  │    state     │
           │  └──────────────┘
           │
           ▼
     ┌──────────────┐
     │ Render full  │
     │   feature    │
     └──────────────┘
```

---

## 📈 Analytics Pipeline

```
User Action
    │
    ▼
┌─────────────────────┐
│  Subscription Event │
│  (purchase, cancel, │
│   upgrade, etc.)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Edge Function      │
│  processes event    │
└──────────┬──────────┘
           │
           ├──────────────┐
           │              │
           ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│ subscriptions   │  │subscription_    │
│ table updated   │  │ audit_log       │
│                 │  │ entry created   │
└─────────────────┘  └────────┬────────┘
                              │
                              │
                              ▼
                     ┌──────────────────┐
                     │ Aggregation Job  │
                     │ (can be cron)    │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │subscription_     │
                     │ analytics        │
                     │ • MRR            │
                     │ • Conversions    │
                     │ • Churn          │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ Admin Dashboard  │
                     │ (visualizations) │
                     └──────────────────┘
```

---

## 🎯 Critical Paths

### Critical Path 1: First-Time User → Premium Trial

```
1. User signs up (Free tier auto-created)
2. User earns 500 dedication points
3. User views premium feature (sees paywall)
4. User clicks "Redeem Points for Discount"
5. User selects "7-Day Premium Trial"
6. Edge Function validates points & extends trial
7. Subscription updated: status='trialing', tier='premium'
8. Feature instantly unlocks
9. User enjoys premium features for 7 days
10. Auto-downgrade to Free when trial ends (cron job)
```

### Critical Path 2: Trial User → Paid Premium

```
1. User on Premium trial (day 5 of 7)
2. User sees "Trial ending soon" reminder
3. User clicks "Upgrade to keep Premium"
4. Redirected to Stripe Checkout
5. User completes payment ($9.99/month)
6. Stripe webhook received & verified
7. Subscription updated: status='active', source='stripe'
8. User retains Premium access indefinitely
9. Auto-renewal on monthly billing cycle
```

### Critical Path 3: Premium → Coach+ Upgrade

```
1. Premium user views Coach Sessions feature
2. Sees "Coach+ required" gate
3. Clicks "Upgrade to Coach+"
4. Views tier comparison in paywall
5. Clicks "Upgrade to Coach+"
6. Stripe checkout with prorated amount
7. Webhook updates subscription to 'coach_plus'
8. Coach Sessions feature unlocks
9. Usage quota tracked (4 sessions/month)
```

---

This architecture ensures:
- ✅ **Security**: Multi-layer validation and RLS
- ✅ **Reliability**: Idempotent operations and audit trails
- ✅ **Scalability**: Edge Functions handle high throughput
- ✅ **User Experience**: Real-time updates and instant unlocks
- ✅ **Compliance**: Complete audit trail for all events
- ✅ **Flexibility**: Support for multiple payment providers
