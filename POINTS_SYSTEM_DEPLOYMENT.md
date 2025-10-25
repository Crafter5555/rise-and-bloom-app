...

# Points System Deployment Guide

## ⚠️ CRITICAL SAFETY WARNINGS

**DO NOT PROCEED WITHOUT**:
1. ✅ Full database backup with verified restore test
2. ✅ Manual approval from engineering lead + ops lead
3. ✅ Successful staging environment test
4. ✅ 24-hour canary at 5% traffic with passing metrics
5. ✅ Rollback plan tested and ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Monitoring](#monitoring)
7. [Rollback Plan](#rollback-plan)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This deployment adds a **server-authoritative points ledger** and **secure coupon redemption system** with:

- ✅ Immutable points ledger (fraud-proof)
- ✅ Anti-replay protection with nonce tracking
- ✅ Device attestation integration (Play Integrity / App Attest)
- ✅ Atomic coupon redemption (prevents race conditions)
- ✅ Trust scoring and fraud detection
- ✅ Manual review workflow for suspicious events
- ✅ HMAC-hashed single-use coupons

---

## Prerequisites

### Environment Variables Required

```bash
# Supabase (already configured)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NEW: Coupon Security
COUPON_SECRET=generate-strong-random-secret-min-32-chars
# Generate with: openssl rand -hex 32

# OPTIONAL: Device Attestation
PLAY_INTEGRITY_PROJECT_NUMBER=your-google-cloud-project
APP_ATTEST_TEAM_ID=your-apple-team-id
```

### Required Tools

- Supabase CLI (`npm install -g supabase`)
- PostgreSQL client (`psql`)
- Node.js 18+ and npm
- Git for version control

---

## Pre-Deployment Checklist

### Phase 1: Staging Environment

- [ ] **Backup Database**
  ```bash
  # Create timestamped backup
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

  # Verify backup integrity
  pg_restore --list backup_*.sql | head
  ```

- [ ] **Test Backup Restore** (on separate test DB)
  ```bash
  createdb points_system_test
  psql points_system_test < backup_*.sql
  # Verify tables and data
  psql points_system_test -c "\dt"
  ```

- [ ] **Apply Migration to Staging**
  ```bash
  supabase db push --db-url $STAGING_DATABASE_URL
  ```

- [ ] **Verify Migration**
  ```sql
  -- Check all tables created
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND (
    table_name LIKE '%points%' OR
    table_name LIKE '%coupon%' OR
    table_name LIKE '%fraud%' OR
    table_name LIKE '%nonce%'
  );

  -- Verify RLS enabled (should be 't')
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN (
    'points_events', 'user_points_cache', 'coupons', 'coupon_templates'
  );

  -- Check policies created
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename;
  ```

- [ ] **Deploy Edge Functions to Staging**
  ```bash
  # Deploy all points-related functions
  supabase functions deploy submit-points-event --project-ref $STAGING_PROJECT
  supabase functions deploy validate-points-event --project-ref $STAGING_PROJECT
  supabase functions deploy redeem-coupon --project-ref $STAGING_PROJECT
  ```

- [ ] **Run Integration Tests**
  ```bash
  npm run test:integration -- --env=staging
  ```

### Phase 2: Staging Validation

- [ ] **Test Event Submission**
  - Submit valid habit completion event
  - Verify event appears in `points_events` with status='pending'
  - Check validation worker processes event
  - Confirm points appear in `user_points_cache`

- [ ] **Test Idempotency**
  - Submit same event twice with same nonce
  - Verify second submission is rejected or returns same result

- [ ] **Test Rate Limiting**
  - Submit 101 events in < 1 hour
  - Verify 101st event is rejected with 429 error

- [ ] **Test Coupon Redemption**
  - Award test user 500 points
  - Redeem $5 Starbucks coupon
  - Verify:
    - Points deducted atomically
    - Coupon code returned (save it!)
    - Subsequent redemption with same code fails

- [ ] **Test Concurrent Redemption** (race condition)
  ```bash
  # Use load testing tool to simulate concurrent redemptions
  artillery quick --count 10 --num 2 $STAGING_URL/api/redeem
  # Verify: Only 1 succeeds, others get insufficient_points
  ```

- [ ] **Test Fraud Detection**
  - Submit events with spacing < 1 second
  - Verify trust score drops below 30
  - Check fraud_insights table for entry

- [ ] **Test Admin UI**
  - Access `/points-admin` page
  - Verify pending events appear
  - Approve/reject an event
  - Confirm fraud alerts display correctly

### Phase 3: Security Audit

- [ ] **Verify RLS Policies**
  ```sql
  -- Test as regular user (should see only their own data)
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims.sub = 'test-user-uuid';

  SELECT * FROM points_events; -- Should only see user's events
  SELECT * FROM user_points_cache; -- Should only see user's cache

  -- Attempt to update directly (should fail)
  UPDATE user_points_cache SET available_points = 999999
  WHERE user_id = 'test-user-uuid'; -- Should fail with RLS error
  ```

- [ ] **Test Service Role Isolation**
  - Verify only Edge Functions can write to points tables
  - Test client-side write attempt (should fail)

- [ ] **Coupon Code Security**
  ```sql
  -- Verify no plaintext codes stored
  SELECT coupon_id, code_hash,
         CASE WHEN plaintext_code IS NULL THEN 'SECURE' ELSE 'INSECURE' END as security
  FROM coupons;
  -- All rows should show 'SECURE'
  ```

- [ ] **Nonce Cleanup**
  ```sql
  -- Verify old nonces are cleaned up
  SELECT COUNT(*), MAX(expires_at) FROM used_nonces
  WHERE expires_at < now();
  -- Should be 0 if cleanup job running
  ```

### Phase 4: Performance Testing

- [ ] **Load Test Event Submission**
  ```bash
  # 100 concurrent users, 10 events each
  artillery run load-test-events.yml

  # Check metrics:
  # - p95 latency < 500ms
  # - Error rate < 0.1%
  # - Database CPU < 70%
  ```

- [ ] **Load Test Redemptions**
  ```bash
  # 50 concurrent redemptions
  artillery run load-test-redemptions.yml

  # Verify:
  # - No duplicate coupons issued
  # - All transactions atomic
  # - No point balance inconsistencies
  ```

- [ ] **Query Performance**
  ```sql
  -- Check slow queries
  EXPLAIN ANALYZE
  SELECT * FROM points_events
  WHERE user_id = 'test-user-id'
  ORDER BY event_time DESC
  LIMIT 50;
  -- Execution time should be < 50ms

  -- Check index usage
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  WHERE tablename IN ('points_events', 'user_points_cache', 'coupons')
  ORDER BY idx_scan DESC;
  ```

---

## Deployment Steps

### Step 1: Production Pre-Checks

```bash
# 1. Verify staging passing all tests
echo "Staging tests status: PASS/FAIL"

# 2. Get approvals
echo "Engineering Lead Approval: [NAME] [DATE]"
echo "Ops Lead Approval: [NAME] [DATE]"

# 3. Schedule maintenance window (optional, zero-downtime deploy)
echo "Deployment scheduled for: [DATE TIME]"
echo "Expected duration: 30 minutes"
```

### Step 2: Production Database Migration

```bash
# 1. Create production backup
pg_dump $PRODUCTION_DATABASE_URL > production_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Store backup securely
aws s3 cp production_backup_*.sql s3://your-backups-bucket/

# 3. Apply migration to production
supabase db push --db-url $PRODUCTION_DATABASE_URL

# 4. Verify migration success
psql $PRODUCTION_DATABASE_URL -c "\dt" | grep points
```

### Step 3: Deploy Edge Functions (5% Canary)

```bash
# Deploy with canary flag
supabase functions deploy submit-points-event --project-ref $PROD_PROJECT
supabase functions deploy validate-points-event --project-ref $PROD_PROJECT
supabase functions deploy redeem-coupon --project-ref $PROD_PROJECT

# Enable feature flag for 5% of users
# (Implement in your application code)
```

### Step 4: Monitor Canary (24-48 hours)

**Metrics to Watch**:

```sql
-- Check event validation rate
SELECT
  validation_status,
  COUNT(*) as count,
  ROUND(AVG(trust_score), 2) as avg_trust_score
FROM points_events
WHERE created_at >= now() - interval '1 hour'
GROUP BY validation_status;

-- Monitor error rates
SELECT
  event_type,
  COUNT(*) FILTER (WHERE validation_status = 'rejected') as rejected,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE validation_status = 'rejected') / COUNT(*), 2) as reject_rate
FROM points_events
WHERE created_at >= now() - interval '1 hour'
GROUP BY event_type;

-- Check coupon redemptions
SELECT
  status,
  COUNT(*) as count,
  SUM(issued_points_cost) as total_points
FROM coupons
WHERE issued_at >= now() - interval '1 hour'
GROUP BY status;
```

**Alert Thresholds**:
- ⚠️ Rejection rate > 10% → Investigate
- 🚨 Rejection rate > 25% → Rollback
- ⚠️ Avg trust score < 40 → Review fraud detection
- 🚨 Duplicate coupons issued → Rollback immediately

### Step 5: Gradual Rollout

If canary successful after 24-48 hours:

```bash
# Increase to 25%
# Update feature flag

# Wait 12 hours, monitor metrics

# Increase to 50%
# Update feature flag

# Wait 12 hours, monitor metrics

# Increase to 100%
# Update feature flag

# Points system fully deployed
```

---

## Verification

### Post-Deployment Checks

```sql
-- 1. Verify data integrity
SELECT
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(points_delta) FILTER (WHERE validation_status = 'validated') as total_points_awarded
FROM points_events;

-- 2. Check user balances match ledger
SELECT
  u.user_id,
  u.available_points as cached_points,
  COALESCE(SUM(p.points_delta) FILTER (WHERE p.validation_status = 'validated'), 0) as ledger_points,
  u.available_points - COALESCE(SUM(p.points_delta) FILTER (WHERE p.validation_status = 'validated'), 0) as discrepancy
FROM user_points_cache u
LEFT JOIN points_events p ON p.user_id = u.user_id
GROUP BY u.user_id, u.available_points
HAVING ABS(u.available_points - COALESCE(SUM(p.points_delta) FILTER (WHERE p.validation_status = 'validated'), 0)) > 0;
-- Should return 0 rows (no discrepancies)

-- 3. Verify coupon codes are hashed
SELECT COUNT(*) FROM coupons WHERE code_hash IS NULL;
-- Should return 0

-- 4. Check for stale pending events
SELECT COUNT(*) FROM points_events
WHERE validation_status = 'pending'
AND created_at < now() - interval '1 hour';
-- Should be low (< 100), indicates worker is processing
```

---

## Monitoring

### Dashboards to Create

1. **Points System Health**
   - Events submitted per hour
   - Validation latency (p50, p95, p99)
   - Trust score distribution
   - Rejection rate by event type

2. **Fraud Detection**
   - Active fraud insights count
   - Fraud insights by severity
   - Manual review queue depth
   - Resolution time metrics

3. **Coupon Redemptions**
   - Redemptions per hour
   - Average points per redemption
   - Top redeemed templates
   - Failed redemption reasons

### Alerts to Configure

```yaml
# Example: Datadog/Sentry alerts

- name: High Rejection Rate
  condition: points_events.rejected / points_events.total > 0.25
  window: 1h
  severity: critical
  action: page_on_call

- name: Points Cache Discrepancy
  condition: abs(cache.points - ledger.points) > 0
  window: 5m
  severity: critical
  action: page_on_call + auto_rollback

- name: Pending Review Queue Growing
  condition: points_events.pending_review > 1000
  window: 1h
  severity: warning
  action: notify_admins

- name: Duplicate Coupon Detected
  condition: coupons.duplicate_code_hash > 0
  window: 1m
  severity: critical
  action: page_on_call + disable_redemptions

- name: Fraud Insight Spike
  condition: fraud_insights.new_count > 50
  window: 1h
  severity: warning
  action: notify_security_team
```

### Logging

Ensure these events are logged:

```typescript
// Event submission
logger.info('points.event.submitted', {
  user_id, event_type, event_id, nonce, trust_score
});

// Validation
logger.info('points.event.validated', {
  event_id, validation_status, points_awarded, trust_score
});

// Redemption
logger.info('points.coupon.redeemed', {
  user_id, template_id, coupon_id, points_cost
});

// Fraud detected
logger.warn('points.fraud.detected', {
  user_id, insight_type, severity, score
});

// Errors
logger.error('points.error', {
  operation, error_message, stack_trace
});
```

---

## Rollback Plan

### When to Rollback

**Immediate Rollback Triggers**:
- 🚨 Duplicate coupons issued
- 🚨 Points cache discrepancies > 1%
- 🚨 Rejection rate > 50%
- 🚨 Database errors > 5%
- 🚨 Edge function error rate > 10%

### Rollback Steps

```bash
# STEP 1: Disable new submissions immediately
# Set feature flag: points_system_enabled = false

# STEP 2: Stop Edge Functions
supabase functions delete submit-points-event --project-ref $PROD_PROJECT
supabase functions delete validate-points-event --project-ref $PROD_PROJECT
supabase functions delete redeem-coupon --project-ref $PROD_PROJECT

# STEP 3: Assess damage
psql $PRODUCTION_DATABASE_URL -c "
SELECT
  COUNT(*) as affected_users,
  SUM(points_delta) as total_points_affected
FROM points_events
WHERE created_at >= '[DEPLOYMENT_TIMESTAMP]'
AND validation_status IN ('validated', 'rejected');
"

# STEP 4: Rollback database (if necessary)
# WARNING: This loses all data since deployment
psql $PRODUCTION_DATABASE_URL < production_backup_[TIMESTAMP].sql

# STEP 5: Verify rollback
psql $PRODUCTION_DATABASE_URL -c "\dt" | grep -c points_events
# Should return 0 (table doesn't exist)

# STEP 6: Notify stakeholders
echo "Rollback completed at $(date)"
echo "Affected users: [COUNT]"
echo "Root cause: [DESCRIPTION]"
echo "Remediation: [PLAN]"
```

### Partial Rollback (Keep Data, Disable Features)

If data is intact but features are buggy:

```sql
-- Stop new event processing (mark all pending as held)
UPDATE points_events
SET validation_status = 'pending_review'
WHERE validation_status = 'pending';

-- Disable coupon templates
UPDATE coupon_templates
SET is_active = false;

-- Continue monitoring with features disabled
```

---

## Troubleshooting

### Issue: Events Stuck in 'pending' Status

**Symptoms**: Events not being validated after 1+ hour

**Debug**:
```sql
SELECT id, created_at, event_type, trust_score
FROM points_events
WHERE validation_status = 'pending'
AND created_at < now() - interval '1 hour'
ORDER BY created_at
LIMIT 10;
```

**Fix**:
```bash
# Manually trigger validation for stuck events
supabase functions invoke validate-points-event --body '{}'
```

### Issue: Points Cache Out of Sync

**Symptoms**: User reports incorrect balance

**Debug**:
```sql
SELECT
  user_id,
  available_points as cached,
  (SELECT SUM(points_delta) FROM points_events WHERE user_id = upc.user_id AND validation_status = 'validated') as actual
FROM user_points_cache upc
WHERE user_id = '[AFFECTED_USER_ID]';
```

**Fix**:
```sql
-- Refresh cache for specific user
SELECT refresh_user_points_cache('[AFFECTED_USER_ID]');

-- Or bulk refresh all users
SELECT user_id, refresh_user_points_cache(user_id)
FROM user_points_cache;
```

### Issue: High Fraud False Positive Rate

**Symptoms**: Legitimate users getting rejected

**Debug**:
```sql
SELECT
  insight_type,
  COUNT(*) as count,
  AVG(score) as avg_score
FROM fraud_insights
WHERE created_at >= now() - interval '24 hours'
GROUP BY insight_type
ORDER BY count DESC;
```

**Fix**:
```typescript
// Adjust trust score thresholds in validate-points-event/index.ts
// Lower validation threshold from 60 to 50
if (trustScore >= 50) { // Was 60
  validationStatus = 'validated';
  ...
}

// Redeploy validation function
```

### Issue: Coupon Redemption Fails with "Insufficient Points"

**Symptoms**: User has points but redemption fails

**Debug**:
```sql
-- Check user's actual points
SELECT * FROM user_points_cache WHERE user_id = '[USER_ID]';

-- Check recent point events
SELECT * FROM points_events
WHERE user_id = '[USER_ID]'
ORDER BY created_at DESC
LIMIT 10;

-- Check for pending events that should be validated
SELECT COUNT(*) FROM points_events
WHERE user_id = '[USER_ID]'
AND validation_status IN ('pending', 'pending_review');
```

**Fix**:
```sql
-- Refresh user's cache
SELECT refresh_user_points_cache('[USER_ID]');

-- Validate pending events
-- (Use admin UI or call validation function)
```

---

## Success Criteria

Deployment considered successful when:

- ✅ No P0/P1 incidents for 7 days post-rollout
- ✅ Event validation latency p95 < 1 second
- ✅ Rejection rate < 5%
- ✅ Fraud detection catching known patterns
- ✅ Zero coupon duplication issues
- ✅ Zero points cache discrepancies
- ✅ User satisfaction score maintained or improved
- ✅ Customer support tickets related to points < 10/day

---

## Post-Deployment Tasks

- [ ] Update user documentation
- [ ] Train customer support on new features
- [ ] Create runbook for common issues
- [ ] Schedule post-mortem meeting
- [ ] Document lessons learned
- [ ] Plan for device attestation integration (Phase 2)
- [ ] Evaluate ML model for fraud detection (Phase 3)

---

## Support Contacts

- **On-Call Engineer**: [PAGERDUTY_LINK]
- **Database Admin**: [EMAIL]
- **Security Team**: [EMAIL]
- **Customer Support Lead**: [EMAIL]

---

## Appendix: SQL Queries for Common Operations

### Award Points Manually (Admin)
```sql
INSERT INTO points_events (
  user_id, event_type, event_time, points_delta,
  proof_type, validation_status, validated_by
) VALUES (
  '[USER_ID]', 'admin_award', now(), 100,
  'manual_admin', 'validated', '[ADMIN_EMAIL]'
);

-- Refresh cache
SELECT refresh_user_points_cache('[USER_ID]');
```

### Revoke Coupon
```sql
UPDATE coupons
SET status = 'revoked', updated_at = now()
WHERE coupon_id = '[COUPON_ID]';

-- Optionally refund points
INSERT INTO points_events (
  user_id, event_type, event_time, points_delta,
  proof_type, validation_status, validated_by,
  related_entity_type, related_entity_id
) VALUES (
  '[USER_ID]', 'coupon_refund', now(), [POINTS_COST],
  'manual_admin', 'validated', '[ADMIN_EMAIL]',
  'coupon', '[COUPON_ID]'
);

SELECT refresh_user_points_cache('[USER_ID]');
```

### View User's Points History
```sql
SELECT
  event_time,
  event_type,
  points_delta,
  validation_status,
  trust_score,
  validated_by
FROM points_events
WHERE user_id = '[USER_ID]'
ORDER BY event_time DESC;
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Status**: READY FOR STAGING DEPLOYMENT
