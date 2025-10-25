/**
 * Points System Integration Tests
 *
 * Run with: npm run test:integration
 *
 * Tests cover:
 * - Event submission and validation
 * - Trust score calculation
 * - Idempotency and replay protection
 * - Rate limiting
 * - Coupon redemption atomicity
 * - Fraud detection
 * - Points cache consistency
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  computePayloadHash,
  generateNonce,
  validateNonce,
  calculateTrustScore,
  validateEventTimestamp,
  checkRateLimit,
  generateSecureCouponCode
} from '../src/utils/pointsCrypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user ID (create before running tests)
const TEST_USER_ID = 'test-user-00000000-0000-0000-0000-000000000000';

describe('Crypto Utilities', () => {
  describe('computePayloadHash', () => {
    it('should generate consistent hash for same payload', async () => {
      const payload = {
        userId: TEST_USER_ID,
        eventType: 'habit_completion',
        eventTime: '2025-01-25T12:00:00Z',
        nonce: 'test-nonce-123',
        data: { habitId: 'habit-123' }
      };

      const hash1 = await computePayloadHash(payload);
      const hash2 = await computePayloadHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hash for different payload', async () => {
      const payload1 = {
        userId: TEST_USER_ID,
        eventType: 'habit_completion',
        eventTime: '2025-01-25T12:00:00Z',
        nonce: 'nonce-1',
        data: {}
      };

      const payload2 = { ...payload1, nonce: 'nonce-2' };

      const hash1 = await computePayloadHash(payload1);
      const hash2 = await computePayloadHash(payload2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateNonce', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce1).toMatch(/^[a-z0-9]+-[a-f0-9]{16}$/);
    });

    it('should be valid when checked', () => {
      const nonce = generateNonce();
      expect(validateNonce(nonce)).toBe(true);
    });
  });

  describe('validateNonce', () => {
    it('should reject invalid format', () => {
      expect(validateNonce('invalid')).toBe(false);
      expect(validateNonce('12345')).toBe(false);
      expect(validateNonce('')).toBe(false);
    });

    it('should reject expired nonce', () => {
      // Nonce from 8 days ago (max age is 7 days)
      const oldTimestamp = (Date.now() - 8 * 24 * 60 * 60 * 1000).toString(36);
      const oldNonce = `${oldTimestamp}-1234567890abcdef`;

      expect(validateNonce(oldNonce)).toBe(false);
    });
  });

  describe('calculateTrustScore', () => {
    it('should return high score for valid attestation', () => {
      const score = calculateTrustScore({
        hasAttestation: true,
        attestationValid: true,
        accountAge: 30,
        eventSpacing: 300
      });

      expect(score).toBeGreaterThanOrEqual(60);
    });

    it('should penalize new accounts', () => {
      const score = calculateTrustScore({
        accountAge: 0.5, // 12 hours old
        eventSpacing: 300
      });

      expect(score).toBeLessThan(30);
    });

    it('should heavily penalize rapid events', () => {
      const score = calculateTrustScore({
        accountAge: 30,
        eventSpacing: 0.5 // Sub-second spacing
      });

      expect(score).toBeLessThan(20);
    });

    it('should return 0 for honeypot trigger', () => {
      const score = calculateTrustScore({
        hasAttestation: true,
        attestationValid: true,
        accountAge: 365,
        hasHoneypot: true
      });

      expect(score).toBe(0);
    });
  });

  describe('validateEventTimestamp', () => {
    it('should accept recent timestamp', () => {
      const now = new Date();
      const result = validateEventTimestamp(now);

      expect(result.valid).toBe(true);
    });

    it('should reject future timestamp', () => {
      const future = new Date(Date.now() + 20 * 60 * 1000); // 20 min future
      const result = validateEventTimestamp(future);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('should reject old timestamp', () => {
      const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const result = validateEventTimestamp(old);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('old');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow events under limit', () => {
      const recentEvents = [
        { timestamp: new Date(), points: 10 }
      ];

      const result = checkRateLimit(recentEvents);
      expect(result.allowed).toBe(true);
    });

    it('should block when hourly event limit exceeded', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentEvents = Array(101).fill(null).map(() => ({
        timestamp: oneHourAgo,
        points: 10
      }));

      const result = checkRateLimit(recentEvents);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Hourly event limit');
    });

    it('should block when hourly points limit exceeded', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentEvents = [
        { timestamp: oneHourAgo, points: 1001 }
      ];

      const result = checkRateLimit(recentEvents);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Hourly points limit');
    });
  });

  describe('generateSecureCouponCode', () => {
    it('should generate formatted code', () => {
      const code = generateSecureCouponCode();

      // Format: XXXX-XXXX-XXXX-XXXX
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it('should generate unique codes', () => {
      const code1 = generateSecureCouponCode();
      const code2 = generateSecureCouponCode();

      expect(code1).not.toBe(code2);
    });
  });
});

describe('Database Functions', () => {
  beforeAll(async () => {
    // Ensure test user exists
    await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: { username: 'testuser' }
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await supabase.from('points_events').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('user_points_cache').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('used_nonces').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('coupons').delete().eq('issued_to', TEST_USER_ID);
    await supabase.from('fraud_insights').delete().eq('user_id', TEST_USER_ID);
  });

  describe('Points Events', () => {
    it('should insert event with service role', async () => {
      const { data, error } = await supabase
        .from('points_events')
        .insert({
          user_id: TEST_USER_ID,
          event_type: 'habit_completion',
          event_time: new Date().toISOString(),
          points_delta: 0,
          proof_type: 'internal',
          payload_hash: 'test-hash-' + Date.now(),
          nonce: generateNonce(),
          validation_status: 'pending'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.event_type).toBe('habit_completion');
    });

    it('should prevent duplicate payload_hash', async () => {
      const payloadHash = 'duplicate-hash-' + Date.now();

      await supabase.from('points_events').insert({
        user_id: TEST_USER_ID,
        event_type: 'habit_completion',
        event_time: new Date().toISOString(),
        points_delta: 10,
        payload_hash: payloadHash,
        nonce: generateNonce(),
        validation_status: 'validated'
      });

      const { error } = await supabase.from('points_events').insert({
        user_id: TEST_USER_ID,
        event_type: 'habit_completion',
        event_time: new Date().toISOString(),
        points_delta: 10,
        payload_hash: payloadHash,
        nonce: generateNonce(),
        validation_status: 'validated'
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('duplicate');
    });
  });

  describe('User Points Cache', () => {
    it('should calculate points correctly', async () => {
      // Insert some validated events
      await supabase.from('points_events').insert([
        {
          user_id: TEST_USER_ID,
          event_type: 'habit_completion',
          event_time: new Date().toISOString(),
          points_delta: 10,
          payload_hash: 'hash-1-' + Date.now(),
          nonce: generateNonce(),
          validation_status: 'validated'
        },
        {
          user_id: TEST_USER_ID,
          event_type: 'workout_completion',
          event_time: new Date().toISOString(),
          points_delta: 20,
          payload_hash: 'hash-2-' + Date.now(),
          nonce: generateNonce(),
          validation_status: 'validated'
        }
      ]);

      // Refresh cache
      const { error } = await supabase.rpc('refresh_user_points_cache', {
        target_user_id: TEST_USER_ID
      });

      expect(error).toBeNull();

      // Check cache
      const { data: cache } = await supabase
        .from('user_points_cache')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .single();

      expect(cache?.available_points).toBe(30); // 10 + 20
      expect(cache?.lifetime_earned).toBe(30);
    });

    it('should handle negative points (redemptions)', async () => {
      // Add points
      await supabase.from('points_events').insert({
        user_id: TEST_USER_ID,
        event_type: 'habit_completion',
        event_time: new Date().toISOString(),
        points_delta: 100,
        payload_hash: 'hash-add-' + Date.now(),
        nonce: generateNonce(),
        validation_status: 'validated'
      });

      // Deduct points
      await supabase.from('points_events').insert({
        user_id: TEST_USER_ID,
        event_type: 'redeem_coupon',
        event_time: new Date().toISOString(),
        points_delta: -50,
        payload_hash: 'hash-deduct-' + Date.now(),
        nonce: generateNonce(),
        validation_status: 'validated'
      });

      // Refresh cache
      await supabase.rpc('refresh_user_points_cache', {
        target_user_id: TEST_USER_ID
      });

      // Check cache
      const { data: cache } = await supabase
        .from('user_points_cache')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .single();

      expect(cache?.available_points).toBe(50); // 100 - 50
      expect(cache?.lifetime_earned).toBe(100);
      expect(cache?.lifetime_spent).toBe(50);
    });
  });

  describe('Nonce Tracking', () => {
    it('should record used nonce', async () => {
      const nonce = generateNonce();

      const { error } = await supabase
        .from('used_nonces')
        .insert({
          user_id: TEST_USER_ID,
          nonce: nonce,
          event_type: 'habit_completion'
        });

      expect(error).toBeNull();

      // Check it exists
      const { data } = await supabase
        .from('used_nonces')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('nonce', nonce)
        .single();

      expect(data).toBeDefined();
    });

    it('should prevent duplicate nonce for same user', async () => {
      const nonce = generateNonce();

      await supabase.from('used_nonces').insert({
        user_id: TEST_USER_ID,
        nonce: nonce
      });

      const { error } = await supabase.from('used_nonces').insert({
        user_id: TEST_USER_ID,
        nonce: nonce
      });

      expect(error).toBeDefined();
    });
  });

  describe('Coupon Templates', () => {
    it('should fetch active templates', async () => {
      const { data, error } = await supabase
        .from('coupon_templates')
        .select('*')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Fraud Insights', () => {
    it('should create fraud insight', async () => {
      const { data, error } = await supabase
        .from('fraud_insights')
        .insert({
          user_id: TEST_USER_ID,
          insight_type: 'velocity_anomaly',
          severity: 'medium',
          score: 45,
          details: { reason: 'Too many events in short time' }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.insight_type).toBe('velocity_anomaly');
    });
  });
});

describe('Edge Functions Integration', () => {
  // These tests require deployed Edge Functions
  // Skip if SKIP_EDGE_FUNCTION_TESTS=true

  const SKIP_TESTS = process.env.SKIP_EDGE_FUNCTION_TESTS === 'true';

  describe('submit-points-event', () => {
    it.skipIf(SKIP_TESTS)('should submit event successfully', async () => {
      const { data, error } = await supabase.functions.invoke('submit-points-event', {
        body: {
          event_type: 'habit_completion',
          event_time: new Date().toISOString(),
          nonce: generateNonce(),
          related_entity_type: 'habit',
          related_entity_id: 'test-habit-id'
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('pending');
    });

    it.skipIf(SKIP_TESTS)('should reject duplicate nonce', async () => {
      const nonce = generateNonce();

      // First submission
      await supabase.functions.invoke('submit-points-event', {
        body: {
          event_type: 'habit_completion',
          event_time: new Date().toISOString(),
          nonce
        }
      });

      // Duplicate submission
      const { data, error } = await supabase.functions.invoke('submit-points-event', {
        body: {
          event_type: 'habit_completion',
          event_time: new Date().toISOString(),
          nonce
        }
      });

      expect(data.error || error).toBeDefined();
      expect((data.error || error.message)).toContain('replay');
    });
  });

  describe('redeem-coupon', () => {
    beforeEach(async () => {
      // Award test user 1000 points
      await supabase.from('points_events').insert({
        user_id: TEST_USER_ID,
        event_type: 'admin_award',
        event_time: new Date().toISOString(),
        points_delta: 1000,
        payload_hash: 'test-award-' + Date.now(),
        nonce: generateNonce(),
        validation_status: 'validated'
      });

      await supabase.rpc('refresh_user_points_cache', {
        target_user_id: TEST_USER_ID
      });
    });

    it.skipIf(SKIP_TESTS)('should redeem coupon successfully', async () => {
      const { data: templates } = await supabase
        .from('coupon_templates')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      const { data, error } = await supabase.functions.invoke('redeem-coupon', {
        body: {
          template_id: templates.id,
          idempotency_key: generateNonce()
        }
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.coupon_code).toBeDefined();
      expect(data.coupon_code).toMatch(/^[A-Z2-9-]+$/);
    });

    it.skipIf(SKIP_TESTS)('should reject insufficient points', async () => {
      // Clear user's points
      await supabase.from('user_points_cache').update({
        available_points: 0
      }).eq('user_id', TEST_USER_ID);

      const { data: templates } = await supabase
        .from('coupon_templates')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      const { data, error } = await supabase.functions.invoke('redeem-coupon', {
        body: {
          template_id: templates.id,
          idempotency_key: generateNonce()
        }
      });

      expect(data.error || error).toBeDefined();
      expect((data.error || error.message)).toContain('Insufficient points');
    });
  });
});

// Run cleanup after all tests
afterAll(async () => {
  // Clean up test data
  await supabase.from('points_events').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('user_points_cache').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('used_nonces').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('coupons').delete().eq('issued_to', TEST_USER_ID);
  await supabase.from('fraud_insights').delete().eq('user_id', TEST_USER_ID);

  console.log('✅ Test cleanup completed');
});
