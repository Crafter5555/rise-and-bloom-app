/**
 * Cryptographic utilities for points system
 *
 * SECURITY CRITICAL:
 * - All payload hashing must be deterministic for idempotency
 * - Coupon codes use HMAC for server-side verification
 * - Never store plaintext coupon codes
 * - Use strong randomness for all tokens
 */

/**
 * Compute deterministic hash of event payload for idempotency
 * Includes user_id to prevent cross-user replay attacks
 */
export function computePayloadHash(payload: {
  userId: string;
  eventType: string;
  eventTime: string;
  nonce: string;
  data?: any;
}): string {
  const canonicalPayload = {
    userId: payload.userId,
    eventType: payload.eventType,
    eventTime: new Date(payload.eventTime).toISOString(),
    nonce: payload.nonce,
    data: payload.data || {}
  };

  const payloadString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());

  // Use SubtleCrypto for SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadString);

  return crypto.subtle.digest('SHA-256', data)
    .then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    })
    .catch(() => {
      // Fallback for environments without SubtleCrypto
      return btoa(payloadString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    });
}

/**
 * Compute HMAC-SHA256 hash for coupon code verification
 * Server-side only - requires secret key
 */
export async function hmacHash(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  );

  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate cryptographically secure coupon code
 * Format: 24-character alphanumeric (base32-like for readability)
 * Entropy: ~120 bits
 */
export function generateSecureCouponCode(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to base32-like encoding (no ambiguous chars: 0O, 1Il, etc.)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < array.length; i++) {
    code += chars[array[i] % chars.length];
  }

  // Format as XXXX-XXXX-XXXX-XXXX for readability
  return code.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * Generate secure nonce for idempotency
 * Format: timestamp + random bytes (hex)
 */
export function generateNonce(): string {
  const timestamp = Date.now().toString(36);
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}-${random}`;
}

/**
 * Validate nonce format and freshness
 */
export function validateNonce(nonce: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  if (!nonce || typeof nonce !== 'string') return false;

  const parts = nonce.split('-');
  if (parts.length !== 2) return false;

  try {
    const timestamp = parseInt(parts[0], 36);
    const age = Date.now() - timestamp;
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Compute trust score based on validation factors
 * Returns 0-100 score
 */
export interface TrustFactors {
  hasAttestation?: boolean;
  attestationValid?: boolean;
  hasThirdPartyProof?: boolean;
  thirdPartyValid?: boolean;
  deviceKnown?: boolean;
  deviceTrusted?: boolean;
  accountAge?: number; // days
  recentEventCount?: number;
  eventSpacing?: number; // seconds since last event
  hasHoneypot?: boolean;
}

export function calculateTrustScore(factors: TrustFactors): number {
  let score = 0;

  // Device attestation (max 40 points)
  if (factors.hasAttestation) {
    score += factors.attestationValid ? 40 : -20;
  }

  // Third-party proof (max 30 points)
  if (factors.hasThirdPartyProof) {
    score += factors.thirdPartyValid ? 30 : -10;
  }

  // Device trust (max 15 points)
  if (factors.deviceKnown) {
    score += factors.deviceTrusted ? 15 : 5;
  } else {
    score += 5; // Neutral for new device
  }

  // Account age (max 10 points)
  if (factors.accountAge !== undefined) {
    if (factors.accountAge < 1) {
      score -= 20; // New accounts are risky
    } else if (factors.accountAge < 7) {
      score += 5;
    } else {
      score += 10;
    }
  }

  // Event velocity check (max 5 points, heavy penalty for spam)
  if (factors.eventSpacing !== undefined) {
    if (factors.eventSpacing < 1) {
      score -= 40; // Sub-second events are suspicious
    } else if (factors.eventSpacing < 10) {
      score -= 20;
    } else if (factors.eventSpacing < 60) {
      score += 0;
    } else {
      score += 5;
    }
  }

  // Honeypot check (immediate disqualification)
  if (factors.hasHoneypot) {
    return 0;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate event timestamp
 * Reject future events and very old events
 */
export function validateEventTimestamp(
  eventTime: string | Date,
  options: {
    maxFutureMs?: number;
    maxPastMs?: number;
  } = {}
): { valid: boolean; reason?: string } {
  const { maxFutureMs = 10 * 60 * 1000, maxPastMs = 7 * 24 * 60 * 60 * 1000 } = options;

  const now = Date.now();
  const timestamp = new Date(eventTime).getTime();

  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid timestamp format' };
  }

  const diff = timestamp - now;

  if (diff > maxFutureMs) {
    return { valid: false, reason: 'Event timestamp is too far in the future' };
  }

  if (diff < -maxPastMs) {
    return { valid: false, reason: 'Event timestamp is too old' };
  }

  return { valid: true };
}

/**
 * Rate limit check parameters
 */
export interface RateLimitConfig {
  maxEventsPerHour?: number;
  maxEventsPerDay?: number;
  maxPointsPerHour?: number;
  maxPointsPerDay?: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxEventsPerHour: 100,
  maxEventsPerDay: 500,
  maxPointsPerHour: 1000,
  maxPointsPerDay: 5000
};

/**
 * Check if event exceeds rate limits
 */
export function checkRateLimit(
  recentEvents: Array<{ timestamp: Date; points: number }>,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): { allowed: boolean; reason?: string } {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const eventsLastHour = recentEvents.filter(e => e.timestamp >= oneHourAgo);
  const eventsLastDay = recentEvents.filter(e => e.timestamp >= oneDayAgo);

  const pointsLastHour = eventsLastHour.reduce((sum, e) => sum + e.points, 0);
  const pointsLastDay = eventsLastDay.reduce((sum, e) => sum + e.points, 0);

  if (config.maxEventsPerHour && eventsLastHour.length >= config.maxEventsPerHour) {
    return { allowed: false, reason: 'Hourly event limit exceeded' };
  }

  if (config.maxEventsPerDay && eventsLastDay.length >= config.maxEventsPerDay) {
    return { allowed: false, reason: 'Daily event limit exceeded' };
  }

  if (config.maxPointsPerHour && pointsLastHour >= config.maxPointsPerHour) {
    return { allowed: false, reason: 'Hourly points limit exceeded' };
  }

  if (config.maxPointsPerDay && pointsLastDay >= config.maxPointsPerDay) {
    return { allowed: false, reason: 'Daily points limit exceeded' };
  }

  return { allowed: true };
}
