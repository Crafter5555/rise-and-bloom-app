/**
 * Validate Points Event Edge Function
 *
 * SECURITY: Server-side validation and trust scoring
 * - Validates pending events
 * - Computes trust scores
 * - Awards points for validated events
 * - Creates fraud insights for suspicious activity
 * - Updates user points cache atomically
 *
 * Deploy: supabase functions deploy validate-points-event
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Points awarded per event type
const POINTS_CONFIG: Record<string, number> = {
  habit_completion: 10,
  workout_completion: 20,
  morning_reflection: 15,
  evening_reflection: 15,
  goal_achieved: 50,
  streak_milestone: 25,
  activity_completion: 10,
};

// Streak bonuses (multiply points)
const STREAK_MULTIPLIERS: Record<number, number> = {
  7: 1.2,   // 7 days: +20%
  14: 1.3,  // 14 days: +30%
  30: 1.5,  // 30 days: +50%
  90: 2.0,  // 90 days: 2x
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // This function should only be called by service role or internally
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event_id, user_id, attestation_token } = body;

    if (!event_id) {
      // If no specific event, process batch of pending events
      return await processPendingEvents(supabase);
    }

    // Validate single event
    const result = await validateEvent(supabase, event_id, attestation_token);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process batch of pending events (cron job style)
 */
async function processPendingEvents(supabase: any) {
  const { data: pendingEvents, error } = await supabase
    .from('points_events')
    .select('*')
    .eq('validation_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch pending events: ${error.message}`);
  }

  const results = [];
  for (const event of pendingEvents || []) {
    try {
      const result = await validateEvent(supabase, event.id, null);
      results.push({ event_id: event.id, status: result.status });
    } catch (error) {
      console.error(`Failed to validate event ${event.id}:`, error);
      results.push({ event_id: event.id, status: 'error', error: error.message });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Validate a single event
 */
async function validateEvent(supabase: any, eventId: string, attestationToken?: string) {
  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('points_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error('Event not found');
  }

  // Skip if already validated
  if (event.validation_status !== 'pending') {
    return { status: event.validation_status, points: event.points_delta };
  }

  // Update status to 'validating' to prevent duplicate processing
  await supabase
    .from('points_events')
    .update({ validation_status: 'validating' })
    .eq('id', eventId);

  // Calculate trust score
  const trustScore = await calculateTrustScore(supabase, event, attestationToken);

  // Determine validation outcome
  let validationStatus: string;
  let pointsAwarded = 0;

  if (trustScore >= 60) {
    // High trust - validate and award points
    validationStatus = 'validated';
    pointsAwarded = await calculatePoints(supabase, event);
  } else if (trustScore >= 30) {
    // Medium trust - pending manual review
    validationStatus = 'pending_review';
    pointsAwarded = 0;

    // Create fraud insight
    await supabase.from('fraud_insights').insert({
      user_id: event.user_id,
      insight_type: 'low_trust_score',
      severity: 'medium',
      score: trustScore,
      details: {
        event_id: eventId,
        event_type: event.event_type,
        trust_score: trustScore
      },
      related_event_ids: [eventId]
    });
  } else {
    // Low trust - reject
    validationStatus = 'rejected';
    pointsAwarded = 0;

    // Create fraud insight
    await supabase.from('fraud_insights').insert({
      user_id: event.user_id,
      insight_type: 'low_trust_score',
      severity: 'high',
      score: trustScore,
      details: {
        event_id: eventId,
        event_type: event.event_type,
        trust_score: trustScore,
        reason: 'Trust score below threshold'
      },
      related_event_ids: [eventId]
    });
  }

  // Update event with validation results
  await supabase
    .from('points_events')
    .update({
      validation_status: validationStatus,
      points_delta: pointsAwarded,
      trust_score: trustScore,
      validated_at: new Date().toISOString(),
      validated_by: 'system'
    })
    .eq('id', eventId);

  // If validated, update user points cache atomically
  if (validationStatus === 'validated' && pointsAwarded > 0) {
    await updateUserPointsCache(supabase, event.user_id);
  }

  return {
    status: validationStatus,
    points: pointsAwarded,
    trust_score: trustScore
  };
}

/**
 * Calculate trust score based on multiple factors
 */
async function calculateTrustScore(supabase: any, event: any, attestationToken?: string): Promise<number> {
  let score = 0;

  // Factor 1: Device attestation (max 40 points)
  if (attestationToken && event.device_id) {
    const attestationValid = await verifyAttestation(attestationToken, event.device_id);
    score += attestationValid ? 40 : -20;
  } else {
    score += 5; // Neutral if no attestation
  }

  // Factor 2: Account age (max 10 points)
  const { data: user } = await supabase.auth.admin.getUserById(event.user_id);
  if (user) {
    const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 1) {
      score -= 20; // New accounts are risky
    } else if (accountAge < 7) {
      score += 5;
    } else {
      score += 10;
    }
  }

  // Factor 3: Event velocity (max 5 points, heavy penalty for spam)
  const { data: recentEvents } = await supabase
    .from('points_events')
    .select('created_at')
    .eq('user_id', event.user_id)
    .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(2);

  if (recentEvents && recentEvents.length > 1) {
    const lastEvent = new Date(recentEvents[1].created_at).getTime();
    const spacing = (Date.now() - lastEvent) / 1000;

    if (spacing < 1) {
      score -= 40; // Sub-second events are very suspicious
    } else if (spacing < 10) {
      score -= 20;
    } else if (spacing < 60) {
      score += 0;
    } else {
      score += 5;
    }
  } else {
    score += 5; // First event or good spacing
  }

  // Factor 4: Device consistency (max 10 points)
  if (event.device_id) {
    const { data: deviceEvents } = await supabase
      .from('points_events')
      .select('id')
      .eq('user_id', event.user_id)
      .eq('device_id', event.device_id)
      .limit(1);

    score += (deviceEvents && deviceEvents.length > 0) ? 10 : 5;
  }

  // Factor 5: Related entity verification (max 20 points)
  if (event.related_entity_type && event.related_entity_id) {
    const entityValid = await verifyRelatedEntity(supabase, event);
    score += entityValid ? 20 : -10;
  }

  // Factor 6: Check for existing fraud flags
  const { data: fraudFlags } = await supabase
    .from('fraud_insights')
    .select('id')
    .eq('user_id', event.user_id)
    .eq('resolved', false)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (fraudFlags && fraudFlags.length > 0) {
    score -= 30; // Active fraud flags reduce trust
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate points to award (including streak bonuses)
 */
async function calculatePoints(supabase: any, event: any): Promise<number> {
  const basePoints = POINTS_CONFIG[event.event_type] || 0;
  if (basePoints === 0) return 0;

  // Calculate streak bonus
  let streakMultiplier = 1.0;

  if (event.event_type === 'habit_completion' && event.related_entity_id) {
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('completion_date')
      .eq('habit_id', event.related_entity_id)
      .eq('user_id', event.user_id)
      .order('completion_date', { ascending: false })
      .limit(90);

    if (completions) {
      const streak = calculateConsecutiveDays(completions.map(c => c.completion_date));
      streakMultiplier = getStreakMultiplier(streak);
    }
  }

  return Math.floor(basePoints * streakMultiplier);
}

/**
 * Calculate consecutive days streak
 */
function calculateConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;

  let streak = 1;
  const sortedDates = dates.map(d => new Date(d).toDateString()).sort().reverse();

  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i - 1]);
    const diffDays = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get streak multiplier based on streak length
 */
function getStreakMultiplier(streak: number): number {
  if (streak >= 90) return STREAK_MULTIPLIERS[90];
  if (streak >= 30) return STREAK_MULTIPLIERS[30];
  if (streak >= 14) return STREAK_MULTIPLIERS[14];
  if (streak >= 7) return STREAK_MULTIPLIERS[7];
  return 1.0;
}

/**
 * Verify device attestation token (placeholder)
 * In production, call Play Integrity API or App Attest
 */
async function verifyAttestation(token: string, deviceId: string): Promise<boolean> {
  // TODO: Implement actual attestation verification
  // For Android: Play Integrity API
  // For iOS: App Attest / DeviceCheck
  // For now, return true for non-empty tokens
  return token && token.length > 0;
}

/**
 * Verify related entity exists and belongs to user
 */
async function verifyRelatedEntity(supabase: any, event: any): Promise<boolean> {
  const { related_entity_type, related_entity_id, user_id } = event;

  try {
    let table: string;
    switch (related_entity_type) {
      case 'habit':
        table = 'habits';
        break;
      case 'goal':
        table = 'goals';
        break;
      case 'task':
        table = 'tasks';
        break;
      case 'activity':
        table = 'activities';
        break;
      case 'workout':
        table = 'workouts';
        break;
      default:
        return false;
    }

    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('id', related_entity_id)
      .eq('user_id', user_id)
      .maybeSingle();

    return data !== null && !error;
  } catch {
    return false;
  }
}

/**
 * Update user points cache atomically
 */
async function updateUserPointsCache(supabase: any, userId: string): Promise<void> {
  // Call the refresh function
  const { error } = await supabase.rpc('refresh_user_points_cache', {
    target_user_id: userId
  });

  if (error) {
    console.error('Failed to update points cache:', error);
  }
}
