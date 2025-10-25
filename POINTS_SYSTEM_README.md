# Points Ledger & Coupon Redemption System

## 🎯 Overview

This is a **production-grade, server-authoritative points system** for Rise and Bloom that prevents client-side cheating, ensures atomic transactions, and includes comprehensive fraud detection.

### Key Features

✅ **Immutable Points Ledger** - Single source of truth, audit-ready
✅ **Atomic Coupon Redemption** - No race conditions or duplicate coupons
✅ **Anti-Replay Protection** - Nonce-based idempotency
✅ **Trust Scoring** - AI fraud detection with manual review workflow
✅ **Device Attestation Ready** - Play Integrity / App Attest integration hooks
✅ **Rate Limiting** - Prevents abuse and spam
✅ **HMAC-Hashed Coupons** - Secure single-use codes
✅ **Admin Dashboard** - Manual review and fraud management

---

## 📁 File Structure

```
supabase/
├── migrations/
│   └── 20250725000001_points_and_coupons.sql    # Database schema
└── functions/
    ├── submit-points-event/                      # Event submission
    ├── validate-points-event/                    # Validation worker
    └── redeem-coupon/                            # Coupon redemption

src/
├── utils/
│   └── pointsCrypto.ts                          # Crypto utilities
├── pages/
│   └── PointsAdmin.tsx                          # Admin dashboard
└── components/
    └── points/                                   # (Future: User-facing UI)

tests/
└── points-system.test.ts                        # Comprehensive tests

docs/
└── POINTS_SYSTEM_DEPLOYMENT.md                  # Deployment guide
```

---

## 🚀 Quick Start (Development)

### 1. Apply Database Migration

```bash
# IMPORTANT: Backup first!
pg_dump $DATABASE_URL > backup.sql

# Apply migration
supabase db push

# Verify
psql $DATABASE_URL -c "\dt" | grep points
```

### 2. Set Environment Variables

```bash
# Add to .env
COUPON_SECRET=your-strong-random-secret-min-32-chars

# Generate secure secret:
openssl rand -hex 32
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy submit-points-event
supabase functions deploy validate-points-event
supabase functions deploy redeem-coupon
```

### 4. Run Tests

```bash
npm run test:integration
```

---

## 💡 How It Works

### Event Submission Flow

```
1. Client submits event → POST /functions/v1/submit-points-event
   ↓
2. Server validates request (auth, nonce, timestamp, rate limit)
   ↓
3. Event inserted as 'pending' in points_events table
   ↓
4. Validation worker processes event
   ↓
5. Trust score calculated (0-100)
   ↓
6. If score ≥ 60 → Validated & points awarded
   If score 30-60 → Pending manual review
   If score < 30 → Rejected
   ↓
7. User points cache updated atomically
```

### Coupon Redemption Flow

```
1. User requests redemption → POST /functions/v1/redeem-coupon
   ↓
2. Server locks user's points cache (FOR UPDATE)
   ↓
3. Check sufficient balance
   ↓
4. Generate secure coupon code (HMAC hashed)
   ↓
5. INSERT coupon + INSERT negative points event (atomic transaction)
   ↓
6. Update points cache
   ↓
7. Return plaintext code to user (only once)
   ↓
8. COMMIT transaction
```

### Trust Scoring

Events are scored 0-100 based on:

- **Device Attestation** (+40 if valid, -20 if invalid)
- **Third-Party Proof** (+30 if confirmed, e.g., Google Fit)
- **Account Age** (-20 for new accounts, +10 for mature)
- **Event Velocity** (-40 for sub-second events)
- **Device Trust** (+15 for known devices)
- **Honeypot Trigger** (instant rejection if triggered)

---

## 📊 Database Tables

### Core Tables

**points_events** - Immutable ledger
- `id` - Event UUID
- `user_id` - User reference
- `event_type` - Type of event (habit_completion, etc.)
- `points_delta` - Points change (+/-)
- `validation_status` - pending/validated/rejected
- `trust_score` - 0-100 score
- `payload_hash` - For idempotency
- `nonce` - Anti-replay token

**user_points_cache** - Fast balance queries
- `user_id` - User reference
- `available_points` - Current spendable points
- `pending_points` - Events awaiting validation
- `lifetime_earned` - Total points ever earned
- `lifetime_spent` - Total points ever spent

**coupons** - Issued coupon codes
- `coupon_id` - Coupon UUID
- `code_hash` - HMAC hash of code (secure)
- `issued_to` - User who redeemed
- `status` - issued/redeemed/revoked/expired
- `expires_at` - Expiration timestamp

**used_nonces** - Replay protection
- `user_id`, `nonce` - Primary key
- `expires_at` - Auto-cleanup after 7 days

**fraud_insights** - Anomaly detection
- `user_id` - Flagged user
- `insight_type` - Type of anomaly
- `severity` - low/medium/high/critical
- `resolved` - Requires manual review

---

## 🔐 Security Features

### 1. Server-Authoritative

- ✅ Client NEVER writes to points tables directly
- ✅ All writes go through Edge Functions with service role key
- ✅ RLS policies prevent client-side tampering

### 2. Idempotency

- ✅ Every event has unique `payload_hash`
- ✅ Duplicate submissions return original result
- ✅ Prevents accidental double-spending

### 3. Anti-Replay

- ✅ Each event requires unique `nonce`
- ✅ Nonces tracked per user
- ✅ Expired nonces auto-cleaned after 7 days

### 4. Atomic Transactions

- ✅ Coupon redemption uses row locking (`FOR UPDATE`)
- ✅ Points deduction + coupon issuance in single transaction
- ✅ Rollback on any failure

### 5. Rate Limiting

- ✅ Max 100 events/hour per user
- ✅ Max 500 events/day per user
- ✅ Max 1000 points/hour per user
- ✅ Max 5000 points/day per user

### 6. Coupon Security

- ✅ Codes stored as HMAC-SHA256 hashes
- ✅ Plaintext code returned only once
- ✅ Single-use enforcement
- ✅ Expiration dates

---

## 🎮 Usage Examples

### Submit Event (Client-Side)

```typescript
import { supabase } from '@/integrations/supabase/client';
import { generateNonce } from '@/utils/pointsCrypto';

async function submitHabitCompletion(habitId: string) {
  const { data, error } = await supabase.functions.invoke('submit-points-event', {
    body: {
      event_type: 'habit_completion',
      event_time: new Date().toISOString(),
      nonce: generateNonce(),
      related_entity_type: 'habit',
      related_entity_id: habitId,
      device_id: getDeviceId(), // From device storage
      device_info: {
        platform: 'ios',
        appVersion: '1.0.0'
      }
    }
  });

  if (error) {
    console.error('Failed to submit event:', error);
    return null;
  }

  return data; // { id, status: 'pending' }
}
```

### Check Points Balance

```typescript
async function getPointsBalance(userId: string) {
  const { data, error } = await supabase
    .from('user_points_cache')
    .select('available_points, pending_points')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Failed to fetch balance:', error);
    return null;
  }

  return {
    available: data.available_points,
    pending: data.pending_points
  };
}
```

### Redeem Coupon

```typescript
async function redeemCoupon(templateId: string) {
  const { data, error } = await supabase.functions.invoke('redeem-coupon', {
    body: {
      template_id: templateId,
      idempotency_key: generateNonce()
    }
  });

  if (error || data.error) {
    console.error('Redemption failed:', error || data.error);
    return null;
  }

  // Save coupon code immediately - won't be shown again!
  const couponCode = data.coupon_code;
  return {
    code: couponCode,
    expiresAt: data.expires_at,
    pointsRemaining: data.points_remaining
  };
}
```

### Admin: Manual Validation

```typescript
// From admin dashboard
async function approveEvent(eventId: string) {
  const { error } = await supabase.functions.invoke('validate-points-event', {
    body: { event_id: eventId }
  });

  if (error) {
    console.error('Validation failed:', error);
    return false;
  }

  return true;
}

async function rejectEvent(eventId: string, reason: string) {
  const { error } = await supabase
    .from('points_events')
    .update({
      validation_status: 'rejected',
      validated_by: 'admin@example.com',
      validated_at: new Date().toISOString(),
      validation_notes: reason
    })
    .eq('id', eventId);

  return !error;
}
```

---

## 🔍 Monitoring & Alerts

### Key Metrics to Track

1. **Event Processing**
   - Events submitted/hour
   - Validation latency (p50, p95, p99)
   - Rejection rate by event type

2. **Trust Scores**
   - Average trust score trend
   - Distribution by score range

3. **Fraud Detection**
   - Active fraud insights count
   - Resolution time
   - False positive rate

4. **Coupon Redemptions**
   - Redemptions/hour
   - Failed redemption reasons
   - Popular templates

### Alert Thresholds

```yaml
🚨 CRITICAL:
  - Rejection rate > 25%
  - Points cache discrepancy detected
  - Duplicate coupon issued
  - Edge function error rate > 10%

⚠️ WARNING:
  - Rejection rate > 10%
  - Pending review queue > 1000
  - Validation latency p95 > 1s
  - Fraud insights spike > 50/hour
```

---

## 🛠️ Maintenance Tasks

### Daily

```bash
# Check validation worker health
psql $DATABASE_URL -c "
SELECT COUNT(*) as pending_count
FROM points_events
WHERE validation_status = 'pending'
AND created_at < now() - interval '1 hour';"

# Monitor rejection rate
psql $DATABASE_URL -c "
SELECT
  validation_status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM points_events
WHERE created_at >= now() - interval '24 hours'
GROUP BY validation_status;"
```

### Weekly

```bash
# Cleanup expired nonces
psql $DATABASE_URL -c "SELECT cleanup_expired_nonces();"

# Mark expired coupons
psql $DATABASE_URL -c "SELECT mark_expired_coupons();"

# Review fraud insights resolution rate
psql $DATABASE_URL -c "
SELECT
  COUNT(*) FILTER (WHERE resolved) as resolved,
  COUNT(*) FILTER (WHERE NOT resolved) as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE resolved) / COUNT(*), 2) as resolution_rate
FROM fraud_insights
WHERE created_at >= now() - interval '7 days';"
```

### Monthly

```bash
# Points balance audit
psql $DATABASE_URL -c "
SELECT
  COUNT(*) as users_with_discrepancy,
  AVG(discrepancy) as avg_discrepancy
FROM (
  SELECT
    u.user_id,
    u.available_points - COALESCE(SUM(p.points_delta) FILTER (WHERE p.validation_status = 'validated'), 0) as discrepancy
  FROM user_points_cache u
  LEFT JOIN points_events p ON p.user_id = u.user_id
  GROUP BY u.user_id, u.available_points
) subq
WHERE ABS(discrepancy) > 0;"

# Should return 0 users with discrepancy
```

---

## 🆘 Troubleshooting

### Issue: User reports incorrect balance

```sql
-- Debug: Check user's ledger vs cache
SELECT
  'CACHE' as source,
  available_points as points
FROM user_points_cache
WHERE user_id = '[USER_ID]'

UNION ALL

SELECT
  'LEDGER' as source,
  SUM(points_delta) as points
FROM points_events
WHERE user_id = '[USER_ID]'
AND validation_status = 'validated';

-- Fix: Refresh cache
SELECT refresh_user_points_cache('[USER_ID]');
```

### Issue: Events stuck in pending

```sql
-- Find stuck events
SELECT id, created_at, event_type
FROM points_events
WHERE validation_status = 'pending'
AND created_at < now() - interval '1 hour'
LIMIT 10;

-- Trigger validation manually
-- Call validate-points-event Edge Function
```

### Issue: Coupon redemption fails

```sql
-- Check user's points
SELECT * FROM user_points_cache WHERE user_id = '[USER_ID]';

-- Check recent events
SELECT * FROM points_events
WHERE user_id = '[USER_ID]'
ORDER BY created_at DESC
LIMIT 10;

-- Verify template exists and is active
SELECT * FROM coupon_templates WHERE id = '[TEMPLATE_ID]';
```

---

## 📞 Support

- **Documentation**: See `POINTS_SYSTEM_DEPLOYMENT.md` for full deployment guide
- **Tests**: Run `npm run test:integration` to verify system health
- **Admin UI**: Access `/points-admin` for manual review dashboard
- **Logs**: Check Supabase Edge Function logs for detailed error traces

---

## 🔄 Future Enhancements

### Phase 2 (Planned)
- [ ] Native device attestation (Play Integrity / App Attest)
- [ ] Third-party fitness provider integration (Google Fit / Apple Health)
- [ ] ML-based fraud detection model
- [ ] Real-time point balance websockets
- [ ] Batch event submission optimization

### Phase 3 (Wishlist)
- [ ] Marketplace for trading coupons (with safety limits)
- [ ] Tiered reward system (Bronze/Silver/Gold)
- [ ] Referral bonuses with anti-abuse
- [ ] Seasonal events and bonus multipliers
- [ ] Charity donation option (convert points to donations)

---

## ⚖️ License & Credits

Built for **Rise and Bloom** wellness app.

**Security Review**: Required before production deployment
**Penetration Testing**: Recommended for high-value coupon systems
**GDPR Compliance**: All user data exportable and deletable

---

**Version**: 1.0.0
**Last Updated**: 2025-01-25
**Status**: ✅ READY FOR STAGING DEPLOYMENT
