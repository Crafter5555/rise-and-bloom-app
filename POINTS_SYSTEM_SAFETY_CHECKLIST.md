# ⚠️ POINTS SYSTEM DEPLOYMENT SAFETY CHECKLIST

## 🚨 CRITICAL WARNINGS

### DO NOT PROCEED WITHOUT:

- [ ] **FULL DATABASE BACKUP WITH VERIFIED RESTORE TEST**
- [ ] **MANUAL APPROVAL FROM ENGINEERING LEAD**
- [ ] **MANUAL APPROVAL FROM OPS LEAD**
- [ ] **SUCCESSFUL STAGING ENVIRONMENT TEST (ALL TESTS PASSING)**
- [ ] **24-HOUR CANARY AT 5% WITH PASSING METRICS**

---

## Pre-Deployment Phase

### Environment Preparation

- [ ] `COUPON_SECRET` environment variable set (32+ characters)
  ```bash
  # Generate with: openssl rand -hex 32
  export COUPON_SECRET="your-generated-secret-here"
  ```

- [ ] Supabase service role key configured
- [ ] All environment variables verified

### Backup and Restore

- [ ] Production database backed up
  ```bash
  pg_dump $PRODUCTION_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Backup stored in secure location (S3/GCS)
- [ ] Backup size verified (should be substantial)
- [ ] Restore test completed on separate test database
  ```bash
  createdb points_test_restore
  psql points_test_restore < backup_*.sql
  psql points_test_restore -c "\dt" | wc -l  # Should show all tables
  ```

- [ ] Restore test data integrity verified
- [ ] Backup retention policy documented (minimum 7 days)

### Staging Environment

- [ ] Migration applied to staging database
  ```bash
  supabase db push --db-url $STAGING_DATABASE_URL
  ```

- [ ] Edge Functions deployed to staging
  ```bash
  supabase functions deploy submit-points-event --project-ref staging
  supabase functions deploy validate-points-event --project-ref staging
  supabase functions deploy redeem-coupon --project-ref staging
  ```

- [ ] Integration tests passing on staging (100%)
  ```bash
  npm run test:integration -- --env=staging
  ```

- [ ] Manual smoke tests completed:
  - [ ] Submit habit completion event
  - [ ] Event appears in pending state
  - [ ] Validation worker processes event
  - [ ] Points appear in user cache
  - [ ] Redeem coupon successfully
  - [ ] Duplicate nonce rejected
  - [ ] Rate limit enforced
  - [ ] Admin dashboard loads and functions

- [ ] Load testing completed:
  - [ ] 100 concurrent users simulated
  - [ ] p95 latency < 2 seconds
  - [ ] Error rate < 1%
  - [ ] Database CPU < 70%

### Security Audit

- [ ] RLS policies verified:
  ```sql
  -- All critical tables should have rowsecurity = 't'
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN (
    'points_events', 'user_points_cache', 'coupons', 'coupon_templates'
  );
  ```

- [ ] Service role isolation tested:
  - [ ] Client-side write attempt fails
  - [ ] Edge Function write succeeds
  - [ ] Users can only see their own data

- [ ] Coupon code security verified:
  ```sql
  -- Should return 0 (no plaintext codes stored)
  SELECT COUNT(*) FROM coupons WHERE plaintext_code IS NOT NULL;
  ```

- [ ] Nonce uniqueness enforced:
  - [ ] Duplicate nonce insert fails

- [ ] Payload hash uniqueness enforced:
  - [ ] Duplicate payload_hash insert fails

### Approval Gates

- [ ] Engineering Lead Approval:
  - Name: ___________________________
  - Date: ___________________________
  - Signature: ___________________________

- [ ] Operations Lead Approval:
  - Name: ___________________________
  - Date: ___________________________
  - Signature: ___________________________

- [ ] Security Review (if required):
  - Name: ___________________________
  - Date: ___________________________
  - Signature: ___________________________

---

## Deployment Phase

### Production Migration

- [ ] Maintenance window scheduled (if applicable):
  - Start time: ___________________________
  - Expected duration: 30 minutes
  - Rollback deadline: ___________________________

- [ ] Team notified of deployment:
  - [ ] Engineering team
  - [ ] Operations team
  - [ ] Customer support team
  - [ ] Stakeholders

- [ ] Migration applied to production:
  ```bash
  supabase db push --db-url $PRODUCTION_DATABASE_URL
  ```

- [ ] Migration verified:
  ```sql
  -- Check all tables created
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND (
    table_name LIKE '%points%' OR table_name LIKE '%coupon%'
  );
  ```

- [ ] Migration audit record created:
  ```sql
  INSERT INTO migration_audit (
    migration_name, applied_by, environment, backup_taken, notes
  ) VALUES (
    '20250725000001_points_and_coupons',
    'your-name',
    'production',
    true,
    'Production deployment after successful staging test'
  );
  ```

### Edge Function Deployment

- [ ] Functions deployed to production:
  ```bash
  supabase functions deploy submit-points-event --project-ref production
  supabase functions deploy validate-points-event --project-ref production
  supabase functions deploy redeem-coupon --project-ref production
  ```

- [ ] Function URLs verified and accessible

- [ ] Function logs monitored (first 15 minutes)

### Canary Rollout (5%)

- [ ] Feature flag enabled for 5% of users
  ```typescript
  // In your app code
  const pointsSystemEnabled = user.id % 100 < 5; // 5% rollout
  ```

- [ ] Canary monitoring (first hour):
  - [ ] Events submitted successfully
  - [ ] Validation worker processing
  - [ ] No critical errors in logs
  - [ ] Rejection rate < 10%
  - [ ] No duplicate coupons
  - [ ] Points cache consistent

- [ ] Canary monitoring (24 hours):
  - [ ] Rejection rate < 5%
  - [ ] Average trust score > 50
  - [ ] Fraud false positive rate < 10%
  - [ ] Customer support tickets < 5
  - [ ] No P0/P1 incidents

### Gradual Rollout

- [ ] Increase to 25% (after 24h canary):
  - [ ] Metrics stable for 12 hours
  - [ ] No degradation in performance
  - [ ] Error rate < 1%

- [ ] Increase to 50% (after 36h):
  - [ ] Metrics stable for 12 hours
  - [ ] Database load acceptable
  - [ ] Support tickets manageable

- [ ] Increase to 100% (after 48h):
  - [ ] Full deployment announcement
  - [ ] User-facing documentation updated
  - [ ] Support team fully trained

---

## Post-Deployment Phase

### Verification (First 24 Hours)

- [ ] Points balance audit:
  ```sql
  -- Should return 0 users with discrepancy
  SELECT COUNT(*) FROM (
    SELECT u.user_id,
      u.available_points - COALESCE(SUM(p.points_delta) FILTER (WHERE p.validation_status = 'validated'), 0) as disc
    FROM user_points_cache u
    LEFT JOIN points_events p ON p.user_id = u.user_id
    GROUP BY u.user_id, u.available_points
  ) subq WHERE ABS(disc) > 0;
  ```

- [ ] Duplicate coupon check:
  ```sql
  -- Should return 0
  SELECT COUNT(*) FROM (
    SELECT code_hash, COUNT(*) FROM coupons
    GROUP BY code_hash HAVING COUNT(*) > 1
  ) dupes;
  ```

- [ ] Validation worker health:
  ```sql
  -- Should be < 100
  SELECT COUNT(*) FROM points_events
  WHERE validation_status = 'pending'
  AND created_at < now() - interval '1 hour';
  ```

- [ ] Event processing rate:
  ```sql
  SELECT COUNT(*) as events_last_hour
  FROM points_events
  WHERE created_at >= now() - interval '1 hour';
  ```

### Monitoring Setup

- [ ] Dashboards created:
  - [ ] Points system health
  - [ ] Fraud detection
  - [ ] Coupon redemptions
  - [ ] Trust score distribution

- [ ] Alerts configured:
  - [ ] High rejection rate (> 25%)
  - [ ] Points cache discrepancy
  - [ ] Duplicate coupon detected
  - [ ] Pending review queue growing
  - [ ] Fraud insight spike

- [ ] On-call rotation updated:
  - Primary: ___________________________
  - Secondary: ___________________________
  - Escalation: ___________________________

### Documentation

- [ ] User documentation updated
- [ ] Support team runbook created
- [ ] Known issues documented
- [ ] FAQ prepared

### Team Training

- [ ] Customer support trained on:
  - [ ] How points system works
  - [ ] Common user questions
  - [ ] How to check user balances
  - [ ] Coupon redemption troubleshooting
  - [ ] Escalation procedures

- [ ] Engineering team briefed on:
  - [ ] System architecture
  - [ ] Common debugging steps
  - [ ] Rollback procedures
  - [ ] Monitoring dashboards

---

## Rollback Triggers

### Immediate Rollback Required If:

- [ ] ❌ Duplicate coupons issued (any count > 0)
- [ ] ❌ Points cache discrepancy > 1% of users
- [ ] ❌ Rejection rate > 50%
- [ ] ❌ Database error rate > 5%
- [ ] ❌ Edge Function error rate > 10%
- [ ] ❌ Data loss or corruption detected
- [ ] ❌ Security vulnerability discovered

### Rollback Procedure

1. [ ] Disable feature flag immediately
   ```typescript
   const pointsSystemEnabled = false; // Emergency disable
   ```

2. [ ] Stop Edge Functions:
   ```bash
   supabase functions delete submit-points-event --project-ref production
   supabase functions delete validate-points-event --project-ref production
   supabase functions delete redeem-coupon --project-ref production
   ```

3. [ ] Assess damage:
   ```sql
   SELECT
     COUNT(DISTINCT user_id) as affected_users,
     SUM(points_delta) as total_points_affected
   FROM points_events
   WHERE created_at >= '[DEPLOYMENT_TIMESTAMP]';
   ```

4. [ ] Decide: Partial or full rollback
   - [ ] **Partial**: Keep data, disable features
   - [ ] **Full**: Restore from backup (data loss)

5. [ ] Execute rollback:
   ```bash
   # Full rollback (if necessary)
   psql $PRODUCTION_DB_URL < backup_[TIMESTAMP].sql
   ```

6. [ ] Verify rollback:
   ```sql
   -- For full rollback, tables should not exist
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_name LIKE '%points%';
   ```

7. [ ] Notify stakeholders:
   - [ ] Engineering team
   - [ ] Operations team
   - [ ] Customer support
   - [ ] Affected users (if necessary)

8. [ ] Post-mortem scheduled:
   - Date: ___________________________
   - Attendees: ___________________________

---

## Success Criteria (Week 1)

### Performance Metrics

- [ ] Event validation p95 latency < 1 second
- [ ] Coupon redemption p95 latency < 2 seconds
- [ ] Edge function error rate < 1%
- [ ] Database query timeout rate < 0.1%

### Quality Metrics

- [ ] Rejection rate < 5%
- [ ] Fraud false positive rate < 10%
- [ ] Manual review resolution time < 4 hours
- [ ] Points cache consistency 100%
- [ ] Duplicate coupon rate 0%

### User Satisfaction

- [ ] Customer support tickets < 10/day
- [ ] User complaints < 5/day
- [ ] Positive feedback received

### System Stability

- [ ] No P0 incidents
- [ ] No P1 incidents
- [ ] Uptime 99.9%+

---

## Post-Deployment Review (7 Days After Full Rollout)

### Metrics Review

- [ ] Event submission rate: _____________ events/hour
- [ ] Validation latency: p50 _____ p95 _____ p99 _____
- [ ] Rejection rate: _____________%
- [ ] Fraud detection rate: _____________%
- [ ] Coupon redemption rate: _____________ redemptions/day

### Issues Encountered

1. Issue: ___________________________
   - Severity: ___________________________
   - Resolution: ___________________________

2. Issue: ___________________________
   - Severity: ___________________________
   - Resolution: ___________________________

3. Issue: ___________________________
   - Severity: ___________________________
   - Resolution: ___________________________

### Adjustments Made

- [ ] Trust score thresholds tuned
- [ ] Rate limits adjusted
- [ ] Fraud detection rules refined
- [ ] Database indexes optimized

### Lessons Learned

1. ___________________________
2. ___________________________
3. ___________________________

### Action Items

- [ ] Action 1: ___________________________
  - Owner: ___________________________
  - Deadline: ___________________________

- [ ] Action 2: ___________________________
  - Owner: ___________________________
  - Deadline: ___________________________

### Sign-Off

- [ ] Deployment considered successful
- [ ] System ready for next phase development
- [ ] Documentation complete and accurate
- [ ] Team trained and confident

**Signed off by**:

Engineering Lead: ___________________________ Date: __________

Operations Lead: ___________________________ Date: __________

Product Owner: ___________________________ Date: __________

---

## 📞 Emergency Contacts

**On-Call Engineer**: [PAGERDUTY_LINK]
**Database Admin**: [EMAIL] [PHONE]
**Security Team**: [EMAIL] [PHONE]
**Engineering Lead**: [EMAIL] [PHONE]
**Operations Lead**: [EMAIL] [PHONE]

---

## 🔗 Quick Links

- **Documentation**: `POINTS_SYSTEM_README.md`
- **Deployment Guide**: `POINTS_SYSTEM_DEPLOYMENT.md`
- **Implementation Summary**: `POINTS_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **Admin Dashboard**: `/points-admin`
- **Supabase Dashboard**: [LINK]
- **Monitoring Dashboards**: [LINK]
- **Incident Response**: [LINK]

---

**Checklist Version**: 1.0
**Last Updated**: 2025-01-25
**Status**: Ready for Use

---

## ✅ Final Sign-Off

I acknowledge that:
- I have read and understand this entire checklist
- I have verified all safety measures are in place
- I am authorized to proceed with this deployment
- I understand the rollback procedures
- I am prepared to monitor the system post-deployment

**Operator Name**: ___________________________

**Signature**: ___________________________

**Date**: ___________________________

**Time**: ___________________________
