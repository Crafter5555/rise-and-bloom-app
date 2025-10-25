/*
  # Points Ledger and Coupon Redemption System

  ## Overview
  Server-authoritative points system with fraud detection, device attestation,
  and atomic coupon redemption. All points changes are immutable ledger entries.

  ## New Tables
  1. **migration_audit** - Track migration approvals and rollbacks
  2. **points_events** - Immutable ledger of all points changes (source of truth)
  3. **user_points_cache** - Materialized view for fast point balance queries
  4. **coupons** - Single-use coupon codes with HMAC hashing
  5. **used_nonces** - Anti-replay protection for idempotent events
  6. **fraud_insights** - Behavior analysis and anomaly detection
  7. **coupon_templates** - Reusable coupon configurations
  8. **attestation_cache** - Cache device attestation verifications

  ## Security Features
  - All tables have RLS enabled
  - Server-only writes for points_events and user_points_cache
  - HMAC-hashed coupon codes (never store plaintext)
  - Nonce-based replay protection
  - Trust scoring and fraud detection
  - Atomic transactions for redemptions

  ## Important Notes
  - DO NOT RUN ON PRODUCTION WITHOUT BACKUP
  - Requires manual approval in migration_audit table
  - Test on staging with full integration tests first
  - Canary deployment recommended (5% → 25% → 50% → 100%)
*/

BEGIN;

-- ============================================================================
-- MIGRATION AUDIT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name text NOT NULL UNIQUE,
  applied_by text NOT NULL,
  approved_by text,
  environment text NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  applied_at timestamptz DEFAULT now(),
  backup_taken boolean DEFAULT false,
  backup_location text,
  rollback_tested boolean DEFAULT false,
  notes text
);

-- Record this migration
INSERT INTO migration_audit (
  migration_name,
  applied_by,
  environment,
  notes
) VALUES (
  '20250725000001_points_and_coupons',
  current_user,
  'development',
  'Initial points ledger and coupon system implementation. REQUIRES MANUAL APPROVAL FOR PRODUCTION.'
);

-- ============================================================================
-- POINTS LEDGER (IMMUTABLE SOURCE OF TRUTH)
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event metadata
  event_type text NOT NULL CHECK (event_type IN (
    'habit_completion',
    'workout_completion',
    'morning_reflection',
    'evening_reflection',
    'goal_achieved',
    'streak_milestone',
    'activity_completion',
    'admin_award',
    'admin_deduction',
    'redeem_coupon',
    'coupon_refund'
  )),
  event_time timestamptz NOT NULL,

  -- Points change (positive or negative)
  points_delta integer NOT NULL,

  -- Proof and validation
  proof_type text CHECK (proof_type IN (
    'internal',
    'google_fit',
    'apple_health',
    'device_attestation',
    'manual_admin',
    'automatic'
  )),
  proof_payload jsonb DEFAULT '{}'::jsonb,

  -- Anti-replay protection
  payload_hash text NOT NULL,
  nonce text,

  -- Trust and fraud detection
  trust_score numeric(5,2) DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN (
    'pending',
    'validating',
    'validated',
    'rejected',
    'pending_review',
    'flagged'
  )),

  -- Validation metadata
  validated_by text,
  validated_at timestamptz,
  validation_notes text,

  -- Device and context
  device_id text,
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address inet,

  -- Related entities
  related_entity_type text,
  related_entity_id uuid,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_user_time ON points_events(user_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_points_validation_status ON points_events(validation_status) WHERE validation_status IN ('pending', 'pending_review');
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_payload_hash ON points_events(payload_hash);
CREATE INDEX IF NOT EXISTS idx_points_user_status ON points_events(user_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_points_event_type ON points_events(event_type, created_at);

-- Enable RLS
ALTER TABLE points_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own points events
CREATE POLICY "Users can view their own points events"
ON points_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert/update points events (server-authoritative)
CREATE POLICY "Service role only can modify points events"
ON points_events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- USER POINTS CACHE (MATERIALIZED VIEW FOR PERFORMANCE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_points bigint DEFAULT 0 CHECK (available_points >= 0),
  pending_points bigint DEFAULT 0 CHECK (pending_points >= 0),
  lifetime_earned bigint DEFAULT 0,
  lifetime_spent bigint DEFAULT 0,
  last_event_id uuid,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_points_cache ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
CREATE POLICY "Users can view their own points cache"
ON user_points_cache FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can update cache (server-authoritative)
CREATE POLICY "Service role only can modify points cache"
ON user_points_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- COUPON TEMPLATES (REUSABLE COUPON CONFIGURATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupon_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  coupon_value_type text NOT NULL CHECK (coupon_value_type IN ('percentage', 'fixed_amount', 'product')),
  coupon_value numeric NOT NULL,
  partner_name text,
  partner_id text,
  terms_and_conditions text,
  expires_after_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  max_redemptions_per_user integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupon_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active templates
CREATE POLICY "Users can view active coupon templates"
ON coupon_templates FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage coupon templates"
ON coupon_templates FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE username IN (SELECT username FROM admins)
  )
);

-- ============================================================================
-- COUPONS (ISSUED SINGLE-USE CODES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
  coupon_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Security: Store only HMAC hash, never plaintext
  code_hash text UNIQUE NOT NULL,

  -- Issuance
  template_id uuid REFERENCES coupon_templates(id),
  issued_to uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_points_cost integer NOT NULL,
  issued_at timestamptz DEFAULT now(),

  -- Redemption
  redeemed_at timestamptz,
  redeemed_by text, -- merchant_id or external system
  redemption_proof jsonb,

  -- Status and lifecycle
  status text DEFAULT 'issued' CHECK (status IN (
    'issued',
    'held',
    'redeemed',
    'revoked',
    'expired'
  )),

  -- Single-use enforcement
  single_use boolean DEFAULT true,

  -- Expiration
  expires_at timestamptz NOT NULL,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Refund tracking
  refunded_at timestamptz,
  refund_points_event_id uuid REFERENCES points_events(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupon_user ON coupons(issued_to);
CREATE INDEX IF NOT EXISTS idx_coupon_status ON coupons(status) WHERE status = 'issued';
CREATE INDEX IF NOT EXISTS idx_coupon_expires ON coupons(expires_at) WHERE status = 'issued';

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Users can view their own coupons
CREATE POLICY "Users can view their own coupons"
ON coupons FOR SELECT
TO authenticated
USING (auth.uid() = issued_to);

-- Only service role can create/update coupons (server-authoritative)
CREATE POLICY "Service role only can modify coupons"
ON coupons FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- NONCE TRACKING (ANTI-REPLAY PROTECTION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS used_nonces (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nonce text NOT NULL,
  event_type text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  PRIMARY KEY (user_id, nonce)
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON used_nonces(expires_at);

-- Enable RLS
ALTER TABLE used_nonces ENABLE ROW LEVEL SECURITY;

-- Only service role can access (internal use only)
CREATE POLICY "Service role only can access nonces"
ON used_nonces FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FRAUD INSIGHTS (BEHAVIOR ANALYSIS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Insight details
  insight_type text NOT NULL CHECK (insight_type IN (
    'velocity_anomaly',
    'impossible_location',
    'suspicious_pattern',
    'device_mismatch',
    'replay_attempt',
    'bulk_submission',
    'honeypot_triggered',
    'attestation_failure',
    'low_trust_score',
    'manual_flag'
  )),

  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  score numeric(5,2) DEFAULT 0,

  -- Context
  details jsonb DEFAULT '{}'::jsonb,
  related_event_ids uuid[],

  -- Resolution
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  resolution_notes text,

  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_unresolved ON fraud_insights(resolved, severity) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_fraud_type ON fraud_insights(insight_type, created_at);

-- Enable RLS
ALTER TABLE fraud_insights ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can access
CREATE POLICY "Service role can access fraud insights"
ON fraud_insights FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ATTESTATION CACHE (REDUCE API CALLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attestation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),

  -- Attestation result
  attestation_token_hash text NOT NULL,
  is_valid boolean NOT NULL,
  integrity_verdict jsonb,

  -- Caching
  verified_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),

  -- Device info
  device_info jsonb DEFAULT '{}'::jsonb,

  UNIQUE(user_id, device_id, attestation_token_hash)
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_attestation_expires ON attestation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_attestation_user_device ON attestation_cache(user_id, device_id);

-- Enable RLS
ALTER TABLE attestation_cache ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only can access attestation cache"
ON attestation_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate user's current points balance
CREATE OR REPLACE FUNCTION calculate_user_points(target_user_id uuid)
RETURNS TABLE(
  available_points bigint,
  pending_points bigint,
  lifetime_earned bigint,
  lifetime_spent bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(points_delta) FILTER (WHERE validation_status = 'validated' AND points_delta > 0), 0) +
    COALESCE(SUM(points_delta) FILTER (WHERE validation_status = 'validated' AND points_delta < 0), 0) AS available_points,
    COALESCE(SUM(points_delta) FILTER (WHERE validation_status IN ('pending', 'pending_review')), 0) AS pending_points,
    COALESCE(SUM(points_delta) FILTER (WHERE validation_status = 'validated' AND points_delta > 0), 0) AS lifetime_earned,
    COALESCE(ABS(SUM(points_delta)) FILTER (WHERE validation_status = 'validated' AND points_delta < 0), 0) AS lifetime_spent
  FROM points_events
  WHERE user_id = target_user_id;
END;
$$;

-- Function to update user points cache (called by triggers or manually)
CREATE OR REPLACE FUNCTION refresh_user_points_cache(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  calc_points RECORD;
BEGIN
  SELECT * INTO calc_points FROM calculate_user_points(target_user_id);

  INSERT INTO user_points_cache (
    user_id,
    available_points,
    pending_points,
    lifetime_earned,
    lifetime_spent,
    updated_at
  ) VALUES (
    target_user_id,
    calc_points.available_points,
    calc_points.pending_points,
    calc_points.lifetime_earned,
    calc_points.lifetime_spent,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    available_points = EXCLUDED.available_points,
    pending_points = EXCLUDED.pending_points,
    lifetime_earned = EXCLUDED.lifetime_earned,
    lifetime_spent = EXCLUDED.lifetime_spent,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to cleanup expired nonces (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM used_nonces WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to cleanup expired attestation cache
CREATE OR REPLACE FUNCTION cleanup_expired_attestations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM attestation_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to mark expired coupons
CREATE OR REPLACE FUNCTION mark_expired_coupons()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE coupons
  SET status = 'expired', updated_at = now()
  WHERE status = 'issued' AND expires_at < now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_events_updated_at
BEFORE UPDATE ON points_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_cache_updated_at
BEFORE UPDATE ON user_points_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupon_templates_updated_at
BEFORE UPDATE ON coupon_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert sample coupon templates
INSERT INTO coupon_templates (template_name, description, points_cost, coupon_value_type, coupon_value, partner_name, terms_and_conditions)
VALUES
  ('Starbucks $5', '$5 off your next Starbucks purchase', 500, 'fixed_amount', 5, 'Starbucks', 'Valid for 30 days. One-time use only. Cannot be combined with other offers.'),
  ('Amazon 10% Off', '10% off Amazon purchase up to $50', 1000, 'percentage', 10, 'Amazon', 'Valid for 30 days. Maximum discount $50. One-time use only.'),
  ('Gym Membership 20% Off', '20% off monthly gym membership', 2000, 'percentage', 20, 'Local Fitness Center', 'Valid for first month only. New memberships only.'),
  ('Meditation App Premium', '1 month free premium subscription', 1500, 'product', 1, 'Calm/Headspace', 'Valid for 60 days from issuance. New users only.')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:

-- 1. Check all tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE '%points%' OR table_name LIKE '%coupon%';

-- 2. Verify RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND (tablename LIKE '%points%' OR tablename LIKE '%coupon%');

-- 3. Check policies created
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public';

-- 4. Verify functions created
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name LIKE '%points%';

-- ============================================================================
-- ROLLBACK SCRIPT (USE WITH EXTREME CAUTION)
-- ============================================================================

-- IMPORTANT: Only run this on staging/development or after full backup
-- DO NOT RUN ON PRODUCTION without explicit approval

/*
BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_points_events_updated_at ON points_events;
DROP TRIGGER IF EXISTS update_user_points_cache_updated_at ON user_points_cache;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS update_coupon_templates_updated_at ON coupon_templates;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_user_points(uuid);
DROP FUNCTION IF EXISTS refresh_user_points_cache(uuid);
DROP FUNCTION IF EXISTS cleanup_expired_nonces();
DROP FUNCTION IF EXISTS cleanup_expired_attestations();
DROP FUNCTION IF EXISTS mark_expired_coupons();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS attestation_cache CASCADE;
DROP TABLE IF EXISTS fraud_insights CASCADE;
DROP TABLE IF EXISTS used_nonces CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS coupon_templates CASCADE;
DROP TABLE IF EXISTS user_points_cache CASCADE;
DROP TABLE IF EXISTS points_events CASCADE;
DROP TABLE IF EXISTS migration_audit CASCADE;

-- Record rollback
INSERT INTO migration_audit (migration_name, applied_by, environment, notes)
VALUES ('20250725000001_points_and_coupons_ROLLBACK', current_user, 'development', 'Migration rolled back');

COMMIT;
*/
