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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, days = 7 } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get app usage data
    const { data: appUsage, error: appError } = await supabase
      .from('app_usage_sessions')
      .select(`
        app_name,
        duration_minutes,
        session_date,
        start_time,
        app_categories (
          name,
          color
        )
      `)
      .eq('user_id', user_id)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0]);

    if (appError) {
      throw appError;
    }

    // Get daily device stats
    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_device_stats')
      .select('*')
      .eq('user_id', user_id)
      .gte('stat_date', startDate.toISOString().split('T')[0])
      .lte('stat_date', endDate.toISOString().split('T')[0]);

    if (statsError) {
      throw statsError;
    }

    // Get focus sessions
    const { data: focusSessions, error: focusError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user_id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (focusError) {
      throw focusError;
    }

    // Process and analyze the data
    const insights = generateInsights(appUsage, dailyStats, focusSessions);

    return new Response(
      JSON.stringify(insights),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in digital-wellbeing-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateInsights(appUsage: any[], dailyStats: any[], focusSessions: any[]) {
  // Calculate total screen time
  const totalScreenTime = appUsage.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  
  // Calculate app category usage
  const categoryUsage = appUsage.reduce((acc, session) => {
    const category = session.app_categories?.name || 'Other';
    acc[category] = (acc[category] || 0) + (session.duration_minutes || 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate average pickups per day
  const avgPickups = dailyStats.length > 0 
    ? dailyStats.reduce((sum, day) => sum + day.total_pickups, 0) / dailyStats.length 
    : 0;

  // Calculate focus time
  const totalFocusTime = focusSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

  // Generate behavioral insights
  const insights = {
    summary: {
      totalScreenTime,
      averagePickupsPerDay: Math.round(avgPickups),
      totalFocusTime,
      mostUsedCategory: Object.keys(categoryUsage).reduce((a, b) => 
        categoryUsage[a] > categoryUsage[b] ? a : b, 'Other'
      )
    },
    categories: categoryUsage,
    trends: {
      screenTimeChange: calculateTrend(dailyStats, 'total_screen_time_minutes'),
      pickupsChange: calculateTrend(dailyStats, 'total_pickups'),
      focusScoreChange: calculateTrend(dailyStats, 'focus_score')
    },
    recommendations: generateRecommendations(categoryUsage, avgPickups, totalFocusTime),
    patterns: {
      peakUsageHours: calculatePeakUsageHours(appUsage),
      longestSessions: findLongestSessions(appUsage),
      focusSessionQuality: calculateFocusQuality(focusSessions)
    }
  };

  return insights;
}

function calculateTrend(dailyStats: any[], field: string) {
  if (dailyStats.length < 2) return 0;
  
  const sortedStats = dailyStats.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime());
  const recent = sortedStats.slice(-3); // Last 3 days
  const previous = sortedStats.slice(0, -3); // Previous days
  
  if (recent.length === 0 || previous.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, day) => sum + (day[field] || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, day) => sum + (day[field] || 0), 0) / previous.length;
  
  return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
}

function generateRecommendations(categoryUsage: Record<string, number>, avgPickups: number, totalFocusTime: number) {
  const recommendations = [];
  
  // Social media usage recommendations
  if (categoryUsage['Social'] && categoryUsage['Social'] > 120) { // More than 2 hours
    recommendations.push({
      type: 'reduce_usage',
      category: 'Social',
      message: 'Consider reducing social media usage. Try setting specific times for checking social apps.',
      priority: 'high'
    });
  }
  
  // Phone pickup recommendations
  if (avgPickups > 100) {
    recommendations.push({
      type: 'reduce_pickups',
      message: 'Your phone pickup frequency is high. Try placing your phone in another room during focus time.',
      priority: 'medium'
    });
  }
  
  // Focus time recommendations
  if (totalFocusTime < 120) { // Less than 2 hours of focus time
    recommendations.push({
      type: 'increase_focus',
      message: 'Try to increase your daily focus time. Start with 25-minute focus sessions.',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

function calculatePeakUsageHours(appUsage: any[]) {
  const hourly = appUsage.reduce((acc, session) => {
    const hour = new Date(session.start_time).getHours();
    acc[hour] = (acc[hour] || 0) + (session.duration_minutes || 0);
    return acc;
  }, {} as Record<number, number>);
  
  return Object.entries(hourly)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, usage]) => ({
      hour: parseInt(hour),
      usage,
      timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`
    }));
}

function findLongestSessions(appUsage: any[]) {
  return appUsage
    .filter(session => session.duration_minutes > 0)
    .sort((a, b) => b.duration_minutes - a.duration_minutes)
    .slice(0, 5)
    .map(session => ({
      appName: session.app_name,
      duration: session.duration_minutes,
      date: session.session_date
    }));
}

function calculateFocusQuality(focusSessions: any[]) {
  if (focusSessions.length === 0) return null;
  
  const totalSessions = focusSessions.length;
  const averageRating = focusSessions
    .filter(session => session.quality_rating)
    .reduce((sum, session) => sum + session.quality_rating, 0) / totalSessions;
  
  const averageInterruptions = focusSessions
    .reduce((sum, session) => sum + (session.interruptions || 0), 0) / totalSessions;
  
  return {
    totalSessions,
    averageRating: Math.round(averageRating * 10) / 10,
    averageInterruptions: Math.round(averageInterruptions * 10) / 10
  };
}