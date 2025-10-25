# Production Deployment Checklist - Subscription System

## ✅ Pre-Deployment Checklist

### Database (Supabase)

- [x] Migration `20251025180001_subscription_system` applied
- [ ] Verify all tables created: `subscriptions`, `entitlements`, `subscription_audit_log`, `subscription_coupons`, `subscription_analytics`
- [ ] Confirm RLS policies active on all tables
- [ ] Verify entitlements seeded (33 feature entitlements)
- [ ] Confirm subscription coupons seeded (5 redemption options)
- [ ] Test database queries with service role
- [ ] Backup database before going live

**Verification Query**:
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%subscription%';

-- Should return: subscriptions, subscription_audit_log, subscription_coupons, subscription_analytics, entitlements
```

### Edge Functions

- [x] `validate-subscription` deployed
- [x] `sync-revenuecat-entitlement` deployed
- [x] `redeem-points-for-subscription` deployed
- [x] `stripe-webhook` deployed
- [ ] Test each function with sample payloads
- [ ] Verify CORS headers work correctly
- [ ] Check function logs for errors
- [ ] Monitor function execution time

**Test Commands**:
```bash
# Test validate-subscription
curl -X POST 'https://[project].supabase.co/functions/v1/validate-subscription' \
  -H 'Authorization: Bearer [token]' \
  -H 'Content-Type: application/json'

# Test stripe-webhook (requires valid signature)
# Use Stripe CLI: stripe trigger checkout.session.completed
```

---

## 🔐 Environment Variables

### Supabase Dashboard Configuration

Navigate to: **Settings → Edge Functions → Secrets**

#### Required for Stripe (Production)

```bash
STRIPE_SECRET_KEY=sk_live_...        # ⚠️ LIVE KEY, not test
STRIPE_WEBHOOK_SECRET=whsec_...      # From Stripe webhook config
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_ANNUAL=price_...
STRIPE_PRICE_ID_COACH_MONTHLY=price_...
STRIPE_PRICE_ID_COACH_ANNUAL=price_...
```

- [ ] Stripe secret key configured (LIVE mode)
- [ ] Webhook secret matches Stripe dashboard
- [ ] All 4 price IDs configured correctly
- [ ] Verify price IDs match actual Stripe products

#### Optional for RevenueCat (Mobile)

```bash
REVENUECAT_API_KEY=sk_...            # RevenueCat secret key
REVENUECAT_WEBHOOK_SECRET=...        # For signature verification
```

- [ ] RevenueCat API key configured
- [ ] Webhook secret configured
- [ ] Test webhook delivery

### Frontend Environment (.env.production)

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ⚠️ LIVE KEY
```

- [ ] Publishable key configured
- [ ] Using LIVE key, not test key
- [ ] Key matches project in Stripe dashboard
- [ ] Rebuild frontend with production env

---

## 💳 Stripe Configuration

### Products & Prices

- [ ] Create "Premium" product in Stripe
- [ ] Create "Coach+" product in Stripe
- [ ] Set up monthly pricing for Premium
- [ ] Set up annual pricing for Premium
- [ ] Set up monthly pricing for Coach+
- [ ] Set up annual pricing for Coach+
- [ ] Copy all price IDs to environment variables
- [ ] Verify prices are in correct currency
- [ ] Test checkout with each price

**Pricing Recommendation**:
```
Premium Monthly: $9.99/month
Premium Annual: $99/year (save $20)
Coach+ Monthly: $29.99/month
Coach+ Annual: $299/year (save $60)
```

### Webhooks

- [ ] Add webhook endpoint in Stripe Dashboard
  - URL: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
  - Description: "Subscription management webhook"
- [ ] Select events to listen:
  - [x] `checkout.session.completed`
  - [x] `customer.subscription.created`
  - [x] `customer.subscription.updated`
  - [x] `customer.subscription.deleted`
  - [x] `customer.subscription.trial_will_end`
  - [x] `invoice.paid`
  - [x] `invoice.payment_failed`
- [ ] Copy webhook signing secret to Supabase
- [ ] Test webhook delivery using Stripe CLI
- [ ] Verify webhook appears in Edge Function logs
- [ ] Monitor webhook success rate

### Customer Portal

- [ ] Enable Customer Portal in Stripe Dashboard
- [ ] Configure portal settings:
  - [x] Allow subscription cancellation
  - [x] Allow plan changes
  - [x] Allow invoice history
  - [ ] Set cancellation policy (immediate or end of period)
- [ ] Test portal access from app
- [ ] Verify cancel flow works correctly

### Payment Methods

- [ ] Enable credit/debit cards
- [ ] Consider enabling: Apple Pay, Google Pay, ACH, etc.
- [ ] Configure payment retry settings
- [ ] Set up email notifications for failed payments

---

## 📱 RevenueCat Configuration (Mobile)

### Products

- [ ] Create "Premium" entitlement in RevenueCat
- [ ] Create "Coach+" entitlement in RevenueCat
- [ ] Link to App Store/Play Store products
- [ ] Configure monthly subscriptions
- [ ] Configure annual subscriptions
- [ ] Set up free trial (7 days)
- [ ] Map products to correct tiers

**Product ID Naming**:
```
iOS: com.yourapp.premium.monthly
Android: premium_monthly
```

### Webhooks

- [ ] Add webhook URL in RevenueCat Dashboard
  - URL: `https://[project-ref].supabase.co/functions/v1/sync-revenuecat-entitlement`
- [ ] Configure webhook authorization
- [ ] Select events:
  - [x] Initial Purchase
  - [x] Renewal
  - [x] Cancellation
  - [x] Expiration
- [ ] Test with sandbox purchases
- [ ] Verify events appear in audit log

### Mobile App Integration

- [ ] Install RevenueCat SDK
- [ ] Configure API keys (iOS/Android)
- [ ] Implement offering fetch
- [ ] Implement purchase flow
- [ ] Implement restore purchases
- [ ] Test sandbox purchases
- [ ] Test subscription sync

---

## 🧪 Testing Requirements

### Database Tests

- [ ] Create subscription for new user (should auto-create free tier)
- [ ] Update subscription tier (free → premium)
- [ ] Check entitlement access for each tier
- [ ] Verify RLS policies block unauthorized access
- [ ] Test audit log entries created
- [ ] Test points redemption (if points system active)

### Backend Tests

- [ ] Validate subscription with valid Stripe subscription
- [ ] Validate subscription with invalid ID (should handle gracefully)
- [ ] Process Stripe webhook (checkout completed)
- [ ] Process Stripe webhook (subscription canceled)
- [ ] Redeem points for discount
- [ ] Redeem points with insufficient balance (should fail)
- [ ] Process duplicate webhook (idempotency check)
- [ ] Verify webhook signature validation

### Frontend Tests

- [ ] Feature gate blocks free user from premium feature
- [ ] Feature gate allows premium user to access feature
- [ ] Paywall modal displays correctly
- [ ] Tier comparison shows accurate information
- [ ] Points redemption button works
- [ ] Subscription badge shows correct tier
- [ ] Real-time updates when subscription changes
- [ ] Navigate to Stripe checkout successfully
- [ ] Return from checkout and verify upgrade

### End-to-End Tests

**Test Flow 1: New User → Trial → Premium**
- [ ] Sign up new account
- [ ] Earn 500 points (or manually add)
- [ ] Redeem points for 7-day trial
- [ ] Verify premium features unlock
- [ ] Purchase premium subscription
- [ ] Verify seamless transition to paid

**Test Flow 2: Stripe Purchase**
- [ ] Start checkout for Premium monthly
- [ ] Complete payment in Stripe
- [ ] Verify webhook received
- [ ] Verify subscription updated in database
- [ ] Verify feature access updated in app
- [ ] Check subscription audit log

**Test Flow 3: Cancellation**
- [ ] Active premium user cancels subscription
- [ ] Verify cancel_at_period_end set correctly
- [ ] Verify access continues until end date
- [ ] Verify downgrade occurs on end date
- [ ] Verify audit log records cancellation

---

## 🔒 Security Verification

### Webhook Security

- [ ] Stripe webhook signature verification working
- [ ] RevenueCat webhook authorization working
- [ ] Invalid signatures rejected
- [ ] Replay attacks prevented (idempotency)
- [ ] Old webhooks rejected (timestamp check)

### Access Control

- [ ] RLS prevents user A from viewing user B's subscription
- [ ] RLS prevents client from modifying subscriptions
- [ ] Service role can modify subscriptions
- [ ] Entitlements readable by authenticated users
- [ ] Admin-only tables restricted properly

### Data Protection

- [ ] Sensitive data (payment info) not stored locally
- [ ] Audit log captures all changes
- [ ] User can view their own audit history
- [ ] GDPR: User data deletable on request
- [ ] PCI compliance (handled by Stripe/RevenueCat)

---

## 📊 Monitoring Setup

### Metrics to Track

- [ ] MRR (Monthly Recurring Revenue)
- [ ] ARR (Annual Recurring Revenue)
- [ ] Trial conversion rate (target: >20%)
- [ ] Churn rate (target: <5% monthly)
- [ ] Payment failure rate (target: <2%)
- [ ] Points redemption rate
- [ ] Webhook success rate (target: >99%)

### Alerts to Configure

- [ ] Payment failures > 10 per hour
- [ ] Webhook failures > 5 per hour
- [ ] Churn rate > 10% in 7 days
- [ ] Trial conversion < 15% weekly
- [ ] Edge Function errors > 1% of requests
- [ ] Database query performance degradation

### Logging

- [ ] Edge Function logs reviewed regularly
- [ ] Subscription audit log monitored
- [ ] Webhook delivery monitored in Stripe Dashboard
- [ ] Error tracking configured (Sentry/similar)

---

## 📝 Documentation

### User-Facing

- [ ] Pricing page created
- [ ] Features comparison table created
- [ ] FAQ for subscriptions
- [ ] Billing/subscription management guide
- [ ] Points redemption explanation
- [ ] Trial terms clearly stated
- [ ] Refund policy documented
- [ ] Contact support for billing issues

### Internal

- [ ] Engineering runbook created
- [ ] Webhook troubleshooting guide
- [ ] Database query reference
- [ ] Rollback procedures documented
- [ ] Incident response plan
- [ ] Support team trained on subscription system

---

## 🚀 Launch Day Checklist

### T-1 Week

- [ ] Complete all testing
- [ ] Backup production database
- [ ] Review all configurations
- [ ] Train support team
- [ ] Prepare announcement materials
- [ ] Set up monitoring dashboards

### T-1 Day

- [ ] Switch to LIVE Stripe keys
- [ ] Verify webhook endpoints
- [ ] Test production checkout flow
- [ ] Confirm monitoring alerts active
- [ ] Brief team on launch

### Launch Day

- [ ] Enable subscription features in app
- [ ] Announce to users (email, in-app, social)
- [ ] Monitor webhook success rate
- [ ] Monitor payment success rate
- [ ] Monitor support requests
- [ ] Check error logs every hour
- [ ] Be ready to rollback if critical issues

### T+1 Week

- [ ] Review first week metrics
- [ ] Analyze conversion rates
- [ ] Gather user feedback
- [ ] Address any bugs or issues
- [ ] Optimize checkout flow if needed
- [ ] Plan improvements based on data

---

## 🔄 Post-Launch Maintenance

### Daily

- [ ] Check webhook delivery rate
- [ ] Review payment failures
- [ ] Monitor Edge Function performance
- [ ] Check for unusual subscription events

### Weekly

- [ ] Review MRR growth
- [ ] Analyze trial conversion rate
- [ ] Check churn rate
- [ ] Review points redemption patterns
- [ ] Identify top cancellation reasons

### Monthly

- [ ] Generate revenue report
- [ ] Analyze tier distribution
- [ ] Review feature gate effectiveness
- [ ] Plan pricing optimizations
- [ ] Review and update documentation

---

## 🐛 Common Issues & Solutions

### Issue: Webhooks not processing

**Symptoms**: Subscriptions not updating after payment
**Solutions**:
- Check webhook signature secret matches
- Verify endpoint URL is correct
- Check Edge Function logs for errors
- Ensure idempotency not blocking events
- Test with Stripe CLI

### Issue: Feature gates not working

**Symptoms**: Premium features locked for paying users
**Solutions**:
- Verify subscription status in database
- Check entitlements table has correct data
- Refresh subscription with validateSubscription()
- Check RLS policies not blocking access
- Clear browser cache

### Issue: Points not deducting

**Symptoms**: Coupon redeemed but points unchanged
**Solutions**:
- Check points_events table for entry
- Run refresh_user_points_cache() function
- Verify points system migration applied
- Check Edge Function logs for errors

### Issue: Trial not expiring

**Symptoms**: Users keep access after trial end
**Solutions**:
- Run process_expired_trials() function manually
- Set up cron job to run daily
- Check trial_end_date is set correctly
- Verify Edge Function can update subscriptions

---

## ✅ Final Verification

Before marking complete, verify:

- [ ] All environment variables configured
- [ ] All Edge Functions deployed and tested
- [ ] Database migration applied
- [ ] Stripe webhooks registered and tested
- [ ] RevenueCat configured (if using mobile)
- [ ] Frontend rebuilt with production env
- [ ] End-to-end purchase flow tested
- [ ] Feature gates tested for all tiers
- [ ] Monitoring and alerts configured
- [ ] Documentation completed
- [ ] Team trained
- [ ] Backup and rollback plan ready

**Deployment Approved By**: _____________________ **Date**: __________

**Production Go-Live**: _____________________ **Time**: __________

---

## 📞 Emergency Contacts

**Database Issues**: Supabase Support
**Payment Issues**: Stripe Support / RevenueCat Support
**App Issues**: Engineering Team Lead
**Business Critical**: Product Manager

---

**Status**: 🟡 Ready for Configuration
**Next Steps**: Complete environment variable configuration and Stripe setup
