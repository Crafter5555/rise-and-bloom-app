import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key
    // This client bypasses RLS and can delete data across all tables
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // List of tables containing user-specific data (in dependency order)
    const userTables = [
      'routine_schedules', // References workout_routines
      'workout_exercises', // References workouts
      'workout_plans',
      'workout_routines',
      'workouts',
      'daily_plans',
      'habit_completions',
      'habits',
      'goals',
      'tasks',
      'activities',
      'mood_entries',
      'app_usage_sessions',
      'daily_device_stats',
      'focus_sessions',
      'digital_wellbeing_settings',
      'user_achievements',
      'user_progress',
      'behavior_insights',
      'profiles' // User profile data
    ];

    let deletedRecords = 0;

    // Delete data from each table
    for (const table of userTables) {
      try {
        const { count, error } = await supabaseServiceRole
          .from(table)
          .delete({ count: 'exact' })
          .eq('user_id', user_id);

        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          throw new Error(`Failed to delete data from ${table}: ${error.message}`);
        }

        deletedRecords += count || 0;
        console.log(`Deleted ${count || 0} records from ${table}`);
      } catch (tableError) {
        console.error(`Error processing table ${table}:`, tableError);
        // Continue with other tables even if one fails
      }
    }

    // Finally, delete the user from auth.users table
    const { error: authError } = await supabaseServiceRole.auth.admin.deleteUser(user_id);
    if (authError) {
      console.error('Error deleting user from auth.users:', authError);
      throw new Error(`Failed to delete user from authentication: ${authError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'User and all associated data deleted successfully',
        deletedRecords,
        tablesProcessed: userTables.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user-data Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});