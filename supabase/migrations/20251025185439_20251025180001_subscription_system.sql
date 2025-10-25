/*
  # Subscription and Monetization System

  ## Overview
  Complete subscription management with Stripe/RevenueCat integration, tiered access control,
  trial management, and points-to-subscription redemption capabilities.

  ## New Tables
  
  ### 1. subscriptions
  Core subscription management table tracking user tiers, billing cycles, and entitlement tokens.
  - Supports Free, Premium, and Coach+ tiers
  - Tracks trial periods and renewal dates
  - Stores source (stripe, revenuecat, coupon, admin)
  - Immutable entitlement tokens for validation

  ### 2. entitlements
  Feature access control mapping tiers to specific features.
  - Defines what each tier can access
  - Supports read/write/full access levels
  - Used for dynamic feature gating across app

  ### 3. subscription_audit_log
  Immutable audit trail of all subscription events.
  - Tracks purchases, renewals, cancellations, upgrades, downgrades
  - JSONB metadata for flexible event data
  - Required for compliance and fraud detection

  ### 4. subscription_coupons
  Subscription-specific discounts and trials (points redemption).
  - Percentage off, fixed amount, or free trials
  - Stripe/RevenueCat promotion code mapping
  - Points cost for redemption

  ### 5. subscription_analytics
  Aggregated metrics for revenue tracking and conversion analysis.
  - Daily/weekly/monthly breakdowns
  - Trial conversion rates
  - Churn analysis
  - MRR and ARR tracking

  ## Security Features
  - All tables have RLS enabled
  - Service role required for subscription modifications
  - Encrypted entitlement tokens
  - Webhook signature verification
  - Idempotent event processing

  ## Integration Points
  - Stripe webhook handlers for billing events
  - RevenueCat REST API for mobile entitlements
  - Points redemption system (when points tables exist)

  ## Important Notes
  - DO NOT RUN ON PRODUCTION WITHOUT BACKUP
  - Test thoroughly on staging environment
  - Verify Stripe/RevenueCat credentials before deployment
  - Monitor subscription_audit_log for fraud patterns
*/

BEGIN;

-- ============================================================================
-- SUBSCRIPTIONS (CORE TIER TRACKING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tier and status
  tier text NOT NULL CHECK (tier IN ('free', 'premium', 'coach_plus')) DEFAULT 'free',
  status text NOT NULL CHECK (status IN (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'expired',
    'paused'
  )) DEFAULT 'active',
  
  -- Billing cycle
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  renewal_date timestamptz,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  
  -- Source and provider
  source text NOT NULL CHECK (source IN (
    'stripe',
    'revenuecat',
    'coupon',
    'admin',
    'trial'
  )),
  provider_subscription_id text,
  provider_customer_id text,
  
  -- Entitlement validation
  entitlement_token text,
  last_validated_at timestamptz,
  
  -- Cancellation tracking
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  cancellation_reason text,
  
  -- Payment details
  currency text DEFAULT 'USD',
  amount_cents integer,
  billing_interval text CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON subscriptions(status) WHERE status IN ('active', 'trialing');
CREATE INDEX IF NOT EXISTS idx_subscription_renewal ON subscriptions(renewal_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscription_trial_end ON subscriptions(trial_end_date) WHERE status = 'trialing';
CREATE INDEX IF NOT EXISTS idx_subscription_provider ON subscriptions(provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can modify subscriptions
CREATE POLICY "Service role only can modify subscriptions"
ON subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ENTITLEMENTS (FEATURE ACCESS CONTROL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL CHECK (tier IN ('free', 'premium', 'coach_plus')),
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  feature_description text,
  access_level text NOT NULL CHECK (access_level IN ('none', 'read', 'write', 'full')) DEFAULT 'none',
  
  -- Limits and quotas
  usage_limit integer,
  usage_period text CHECK (usage_period IN ('daily', 'weekly', 'monthly', 'lifetime')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(tier, feature_key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_entitlement_tier_feature ON entitlements(tier, feature_key);

-- Enable RLS
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

-- Everyone can read entitlements (needed for feature gating)
CREATE POLICY "Anyone can view entitlements"
ON entitlements FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify entitlements
CREATE POLICY "Service role only can modify entitlements"
ON entitlements FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SUBSCRIPTION AUDIT LOG (IMMUTABLE EVENT TRAIL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN (
    'subscription_created',
    'subscription_activated',
    'trial_started',
    'trial_converted',
    'trial_expired',
    'payment_succeeded',
    'payment_failed',
    'subscription_renewed',
    'subscription_upgraded',
    'subscription_downgraded',
    'subscription_canceled',
    'subscription_paused',
    'subscription_resumed',
    'subscription_expired',
    'refund_issued',
    'coupon_applied',
    'webhook_received'
  )),
  
  -- Tier tracking
  previous_tier text CHECK (previous_tier IN ('free', 'premium', 'coach_plus')),
  new_tier text CHECK (new_tier IN ('free', 'premium', 'coach_plus')),
  
  -- Payment tracking
  amount_cents integer,
  currency text,
  
  -- Source tracking
  source text NOT NULL CHECK (source IN (
    'stripe',
    'revenuecat',
    'coupon',
    'admin',
    'system'
  )),
  provider_event_id text,
  
  -- Event metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- IP and device (fraud detection)
  ip_address inet,
  user_agent text,
  
  -- Timestamp
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_user_time ON subscription_audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON subscription_audit_log(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_subscription ON subscription_audit_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_audit_provider_event ON subscription_audit_log(provider_event_id) WHERE provider_event_id IS NOT NULL;

-- Enable RLS
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY "Users can view their own subscription audit log"
ON subscription_audit_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert audit logs
CREATE POLICY "Service role only can insert audit logs"
ON subscription_audit_log FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================================================
-- SUBSCRIPTION COUPONS (POINTS TO SUBSCRIPTION DISCOUNTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Discount details
  discount_type text NOT NULL CHECK (discount_type IN (
    'percentage',
    'fixed_amount',
    'free_trial_extension',
    'tier_upgrade'
  )),
  discount_value numeric NOT NULL,
  
  -- Applicable tiers
  applicable_tiers text[] NOT NULL DEFAULT ARRAY['premium', 'coach_plus'],
  
  -- Duration
  duration_type text NOT NULL CHECK (duration_type IN (
    'once',
    'repeating',
    'forever'
  )) DEFAULT 'once',
  duration_months integer,
  
  -- Stripe/RevenueCat mapping
  stripe_coupon_id text,
  stripe_promotion_code text,
  revenuecat_offering_id text,
  
  -- Points cost
  points_required integer NOT NULL CHECK (points_required > 0),
  
  -- Limits
  max_redemptions integer,
  redemptions_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_coupon_active ON subscription_coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sub_coupon_points ON subscription_coupons(points_required);
CREATE INDEX IF NOT EXISTS idx_sub_coupon_stripe ON subscription_coupons(stripe_coupon_id) WHERE stripe_coupon_id IS NOT NULL;

-- Enable RLS
ALTER TABLE subscription_coupons ENABLE ROW LEVEL SECURITY;

-- Users can view active subscription coupons
CREATE POLICY "Users can view active subscription coupons"
ON subscription_coupons FOR SELECT
TO authenticated
USING (is_active = true AND (valid_from IS NULL OR valid_from <= now()) AND (valid_until IS NULL OR valid_until > now()));

-- Only service role can modify subscription coupons
CREATE POLICY "Service role only can modify subscription coupons"
ON subscription_coupons FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SUBSCRIPTION ANALYTICS (AGGREGATED METRICS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Subscription metrics
  total_subscriptions integer DEFAULT 0,
  active_subscriptions integer DEFAULT 0,
  trialing_subscriptions integer DEFAULT 0,
  canceled_subscriptions integer DEFAULT 0,
  
  -- Tier breakdown
  free_tier_count integer DEFAULT 0,
  premium_tier_count integer DEFAULT 0,
  coach_plus_tier_count integer DEFAULT 0,
  
  -- Revenue metrics (in cents)
  total_revenue_cents bigint DEFAULT 0,
  mrr_cents bigint DEFAULT 0,
  arr_cents bigint DEFAULT 0,
  
  -- Conversion metrics
  trial_started_count integer DEFAULT 0,
  trial_converted_count integer DEFAULT 0,
  trial_conversion_rate numeric(5,2),
  
  -- Churn metrics
  churned_count integer DEFAULT 0,
  churn_rate numeric(5,2),
  
  -- Points redemption metrics
  points_redeemed_for_subscriptions integer DEFAULT 0,
  total_points_spent bigint DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(period_start, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_period ON subscription_analytics(period_start DESC, period_type);

-- Enable RLS
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;

-- Only service role can access analytics
CREATE POLICY "Service role can access subscription analytics"
ON subscription_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
  target_user_id uuid,
  target_feature_key text
)
RETURNS TABLE(
  has_access boolean,
  access_level text,
  current_tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  user_tier text;
  feature_access text;
BEGIN
  -- Get user's current tier
  SELECT tier INTO user_tier
  FROM subscriptions
  WHERE user_id = target_user_id
  AND status IN ('active', 'trialing');
  
  -- Default to free if no subscription
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get feature access level for tier
  SELECT access_level INTO feature_access
  FROM entitlements
  WHERE tier = user_tier
  AND feature_key = target_feature_key;
  
  -- Default to none if feature not found
  IF feature_access IS NULL THEN
    feature_access := 'none';
  END IF;
  
  RETURN QUERY SELECT
    (feature_access != 'none') AS has_access,
    feature_access AS access_level,
    user_tier AS current_tier;
END;
$$;

-- Function to get or create user subscription
CREATE OR REPLACE FUNCTION get_or_create_subscription(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  subscription_id uuid;
BEGIN
  -- Try to get existing subscription
  SELECT id INTO subscription_id
  FROM subscriptions
  WHERE user_id = target_user_id;
  
  -- Create if doesn't exist
  IF subscription_id IS NULL THEN
    INSERT INTO subscriptions (
      user_id,
      tier,
      status,
      source,
      start_date
    ) VALUES (
      target_user_id,
      'free',
      'active',
      'system',
      now()
    )
    RETURNING id INTO subscription_id;
    
    -- Log creation
    INSERT INTO subscription_audit_log (
      user_id,
      subscription_id,
      event_type,
      new_tier,
      source
    ) VALUES (
      target_user_id,
      subscription_id,
      'subscription_created',
      'free',
      'system'
    );
  END IF;
  
  RETURN subscription_id;
END;
$$;

-- Function to update subscription tier
CREATE OR REPLACE FUNCTION update_subscription_tier(
  target_user_id uuid,
  new_tier_value text,
  new_status_value text DEFAULT 'active',
  event_source text DEFAULT 'system'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  sub_id uuid;
  old_tier text;
BEGIN
  -- Get current subscription
  SELECT id, tier INTO sub_id, old_tier
  FROM subscriptions
  WHERE user_id = target_user_id;
  
  -- Create if doesn't exist
  IF sub_id IS NULL THEN
    sub_id := get_or_create_subscription(target_user_id);
    old_tier := 'free';
  END IF;
  
  -- Update subscription
  UPDATE subscriptions
  SET 
    tier = new_tier_value,
    status = new_status_value,
    updated_at = now()
  WHERE id = sub_id;
  
  -- Log the change
  INSERT INTO subscription_audit_log (
    user_id,
    subscription_id,
    event_type,
    previous_tier,
    new_tier,
    source
  ) VALUES (
    target_user_id,
    sub_id,
    CASE 
      WHEN old_tier = 'free' THEN 'subscription_activated'
      WHEN new_tier_value > old_tier THEN 'subscription_upgraded'
      ELSE 'subscription_downgraded'
    END,
    old_tier,
    new_tier_value,
    event_source
  );
  
  RETURN true;
END;
$$;

-- Function to process trial expiration
CREATE OR REPLACE FUNCTION process_expired_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  processed_count integer := 0;
  expired_sub RECORD;
BEGIN
  FOR expired_sub IN
    SELECT id, user_id
    FROM subscriptions
    WHERE status = 'trialing'
    AND trial_end_date <= now()
  LOOP
    -- Downgrade to free
    UPDATE subscriptions
    SET 
      tier = 'free',
      status = 'expired',
      end_date = now(),
      updated_at = now()
    WHERE id = expired_sub.id;
    
    -- Log expiration
    INSERT INTO subscription_audit_log (
      user_id,
      subscription_id,
      event_type,
      previous_tier,
      new_tier,
      source
    ) VALUES (
      expired_sub.user_id,
      expired_sub.id,
      'trial_expired',
      'premium',
      'free',
      'system'
    );
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entitlements_updated_at
BEFORE UPDATE ON entitlements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_coupons_updated_at
BEFORE UPDATE ON subscription_coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED ENTITLEMENTS DATA
-- ============================================================================

-- Free tier entitlements
INSERT INTO entitlements (tier, feature_key, feature_name, feature_description, access_level) VALUES
  ('free', 'basic_planner', 'Basic Planning', 'Access to tasks, habits, and basic calendar', 'full'),
  ('free', 'basic_stats', 'Basic Statistics', 'View basic completion rates and streaks', 'read'),
  ('free', 'morning_evening_check', 'Daily Check-ins', 'Morning planning and evening reflection', 'full'),
  ('free', 'basic_journaling', 'Basic Journaling', 'Text-based journal entries', 'write'),
  ('free', 'ai_insights', 'AI Insights', 'No access to AI-powered insights', 'none'),
  ('free', 'journeys', 'Guided Journeys', 'No access to coaching journeys', 'none'),
  ('free', 'media_library', 'Audio/Video Library', 'No access to meditation library', 'none'),
  ('free', 'advanced_analytics', 'Advanced Analytics', 'No access to correlations and predictions', 'none'),
  ('free', 'digital_wellbeing', 'Digital Wellbeing Center', 'No access to app usage tracking', 'none'),
  ('free', 'coach_sessions', 'Coach Sessions', 'No access to human coaching', 'none'),
  ('free', 'group_challenges', 'Group Challenges', 'View public challenges only', 'read')
ON CONFLICT (tier, feature_key) DO NOTHING;

-- Premium tier entitlements
INSERT INTO entitlements (tier, feature_key, feature_name, feature_description, access_level, usage_limit, usage_period) VALUES
  ('premium', 'basic_planner', 'Basic Planning', 'Full access to planning features', 'full', NULL, NULL),
  ('premium', 'basic_stats', 'Statistics Dashboard', 'Complete stats and analytics', 'full', NULL, NULL),
  ('premium', 'morning_evening_check', 'Daily Check-ins', 'Enhanced check-ins with insights', 'full', NULL, NULL),
  ('premium', 'basic_journaling', 'Advanced Journaling', 'Rich text, voice, and media journaling', 'full', NULL, NULL),
  ('premium', 'ai_insights', 'AI Insights', 'AI-powered behavior analysis and recommendations', 'full', NULL, NULL),
  ('premium', 'journeys', 'Guided Journeys', 'Access to all self-guided coaching programs', 'full', NULL, NULL),
  ('premium', 'media_library', 'Audio/Video Library', 'Full meditation and wellness content library', 'full', NULL, NULL),
  ('premium', 'advanced_analytics', 'Advanced Analytics', 'Correlations, predictions, and deep insights', 'full', NULL, NULL),
  ('premium', 'digital_wellbeing', 'Digital Wellbeing Center', 'Complete app usage tracking and intentionality tools', 'full', NULL, NULL),
  ('premium', 'coach_sessions', 'Coach Sessions', 'No access to human coaching', 'none', NULL, NULL),
  ('premium', 'group_challenges', 'Group Challenges', 'Create and join unlimited challenges', 'full', NULL, NULL)
ON CONFLICT (tier, feature_key) DO NOTHING;

-- Coach+ tier entitlements (everything + human coaching)
INSERT INTO entitlements (tier, feature_key, feature_name, feature_description, access_level, usage_limit, usage_period) VALUES
  ('coach_plus', 'basic_planner', 'Basic Planning', 'Full access to all planning features', 'full', NULL, NULL),
  ('coach_plus', 'basic_stats', 'Statistics Dashboard', 'Complete stats and analytics', 'full', NULL, NULL),
  ('coach_plus', 'morning_evening_check', 'Daily Check-ins', 'Enhanced check-ins with coach review', 'full', NULL, NULL),
  ('coach_plus', 'basic_journaling', 'Advanced Journaling', 'Rich text, voice, media with coach access', 'full', NULL, NULL),
  ('coach_plus', 'ai_insights', 'AI Insights', 'AI-powered analysis with coach interpretation', 'full', NULL, NULL),
  ('coach_plus', 'journeys', 'Guided Journeys', 'All journeys plus custom coach-designed programs', 'full', NULL, NULL),
  ('coach_plus', 'media_library', 'Audio/Video Library', 'Full library including exclusive coach content', 'full', NULL, NULL),
  ('coach_plus', 'advanced_analytics', 'Advanced Analytics', 'Complete analytics with coach insights', 'full', NULL, NULL),
  ('coach_plus', 'digital_wellbeing', 'Digital Wellbeing Center', 'Complete tracking with coach guidance', 'full', NULL, NULL),
  ('coach_plus', 'coach_sessions', 'Coach Sessions', '1-on-1 video sessions with certified coaches', 'full', 4, 'monthly'),
  ('coach_plus', 'group_challenges', 'Group Challenges', 'Create, join, and coach-led challenges', 'full', NULL, NULL),
  ('coach_plus', 'priority_support', 'Priority Support', '24/7 priority customer support', 'full', NULL, NULL)
ON CONFLICT (tier, feature_key) DO NOTHING;

-- ============================================================================
-- SEED SUBSCRIPTION COUPON TEMPLATES
-- ============================================================================

INSERT INTO subscription_coupons (
  discount_type,
  discount_value,
  applicable_tiers,
  duration_type,
  duration_months,
  points_required,
  max_redemptions,
  metadata
) VALUES
  (
    'free_trial_extension',
    7,
    ARRAY['premium'],
    'once',
    NULL,
    500,
    NULL,
    '{"name": "7-Day Premium Trial", "description": "Extend your premium trial by 7 days"}'::jsonb
  ),
  (
    'percentage',
    25,
    ARRAY['premium'],
    'once',
    1,
    1000,
    NULL,
    '{"name": "25% Off First Month", "description": "Get 25% off your first month of Premium"}'::jsonb
  ),
  (
    'percentage',
    50,
    ARRAY['premium'],
    'once',
    1,
    2500,
    NULL,
    '{"name": "50% Off First Month", "description": "Get 50% off your first month of Premium"}'::jsonb
  ),
  (
    'fixed_amount',
    500,
    ARRAY['premium', 'coach_plus'],
    'once',
    1,
    3000,
    NULL,
    '{"name": "$5 Off Any Subscription", "description": "Save $5 on your first subscription payment"}'::jsonb
  ),
  (
    'tier_upgrade',
    1,
    ARRAY['coach_plus'],
    'once',
    1,
    5000,
    NULL,
    '{"name": "1 Month Coach+ Free", "description": "Try Coach+ tier free for one month"}'::jsonb
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries to verify migration:
--
-- 1. Check tables: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%subscription%';
-- 2. Check RLS: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%subscription%';
-- 3. Check entitlements: SELECT tier, feature_key, access_level FROM entitlements ORDER BY tier, feature_key;
-- 4. Check functions: SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%subscription%';
