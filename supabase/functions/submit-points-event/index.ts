/**
 * Submit Points Event Edge Function
 *
 * SECURITY: Server-authoritative event submission
 * - Client proposes events, server validates and awards points
 * - All writes require service role key
 * - Idempotent via nonce/payload_hash
 * - Anti-replay protection
 * - Rate limiting
 * - Trust scoring
 *
 * Deploy: supabase functions deploy submit-points-event
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EventSubmission {
  event_type: string;
  event_time: string;
  nonce: string;
  related_entity_type?: string;
  related_entity_id?: string;
  proof_payload?: any;
  attestation_token?: string;
  device_id?: string;
  device_info?: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: EventSubmission = await req.json();
    const { event_type, event_time, nonce, related_entity_type, related_entity_id, proof_payload, attestation_token, device_id, device_info } = body;

    // Validate required fields
    if (!event_type || !event_time || !nonce) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_type, event_time, nonce' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate event type
    const validEventTypes = [
      'habit_completion',
      'workout_completion',
      'morning_reflection',
      'evening_reflection',
      'goal_achieved',
      'streak_milestone',
      'activity_completion'
    ];

    if (!validEventTypes.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute payload hash for idempotency
    const payloadForHash = {
      userId: user.id,
      eventType: event_type,
      eventTime: new Date(event_time).toISOString(),
      nonce,
      data: proof_payload || {}
    };
    const payloadString = JSON.stringify(payloadForHash, Object.keys(payloadForHash).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const payload_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create service role client for writes
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing event (idempotency)
    const { data: existing, error: existingError } = await supabaseService
      .from('points_events')
      .select('id, validation_status, points_delta')
      .eq('payload_hash', payload_hash)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          id: existing.id,
          status: existing.validation_status,
          points: existing.points_delta,
          message: 'Event already processed (idempotent)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check nonce (anti-replay)
    const { data: nonceCheck, error: nonceError } = await supabaseService
      .from('used_nonces')
      .select('nonce')
      .eq('user_id', user.id)
      .eq('nonce', nonce)
      .maybeSingle();

    if (nonceCheck) {
      return new Response(
        JSON.stringify({ error: 'Nonce already used (replay attempt detected)' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate timestamp (reject future events > 10min, old events > 7 days)
    const now = Date.now();
    const eventTimestamp = new Date(event_time).getTime();
    const diff = eventTimestamp - now;

    if (isNaN(eventTimestamp)) {
      return new Response(
        JSON.stringify({ error: 'Invalid timestamp format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (diff > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Event timestamp is too far in the future' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (diff < -7 * 24 * 60 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Event timestamp is too old' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check (simple version)
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const { data: recentEvents, error: recentError } = await supabaseService
      .from('points_events')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (recentEvents && recentEvents.length >= 100) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: too many events in the last hour' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for fraud detection
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Insert pending event
    const { data: insertedEvent, error: insertError } = await supabaseService
      .from('points_events')
      .insert({
        user_id: user.id,
        event_type,
        event_time: new Date(event_time).toISOString(),
        points_delta: 0, // Will be set by validator
        proof_type: attestation_token ? 'device_attestation' : 'internal',
        proof_payload: proof_payload || {},
        payload_hash,
        nonce,
        trust_score: 0, // Will be calculated by validator
        validation_status: 'pending',
        device_id,
        device_info: device_info || {},
        ip_address,
        related_entity_type,
        related_entity_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert event:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create event', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record nonce
    await supabaseService.from('used_nonces').insert({
      user_id: user.id,
      nonce,
      event_type
    });

    // Trigger validation (background processing)
    // In production, this would be a queue/worker
    // For now, we'll trigger inline validation
    await triggerEventValidation(supabaseService, insertedEvent.id, user.id, attestation_token);

    return new Response(
      JSON.stringify({
        id: insertedEvent.id,
        status: 'pending',
        message: 'Event submitted for validation'
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Trigger event validation (would be queue in production)
 */
async function triggerEventValidation(supabase: any, eventId: string, userId: string, attestationToken?: string) {
  try {
    // Call validation function
    await supabase.functions.invoke('validate-points-event', {
      body: { event_id: eventId, user_id: userId, attestation_token: attestationToken }
    });
  } catch (error) {
    console.error('Failed to trigger validation:', error);
  }
}
