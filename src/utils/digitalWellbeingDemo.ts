import { supabase } from '@/integrations/supabase/client';

// Demo data creator for testing digital wellbeing features
export const createDemoDigitalWellbeingData = async (userId: string) => {
  try {
    // Get app categories
    const { data: categories } = await supabase
      .from('app_categories')
      .select('*');

    if (!categories) return;

    const socialCategory = categories.find(c => c.name === 'Social');
    const entertainmentCategory = categories.find(c => c.name === 'Entertainment');
    const professionalCategory = categories.find(c => c.name === 'Professional');

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Create sample app usage sessions for today
    const todaysSessions = [
      {
        user_id: userId,
        app_name: 'Instagram',
        category_id: socialCategory?.id,
        start_time: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        end_time: new Date(today.getTime() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
        duration_minutes: 30,
        session_date: today.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'TikTok',
        category_id: entertainmentCategory?.id,
        start_time: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        end_time: new Date(today.getTime() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
        duration_minutes: 30,
        session_date: today.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'YouTube',
        category_id: entertainmentCategory?.id,
        start_time: new Date(today.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        end_time: new Date(today.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        duration_minutes: 60,
        session_date: today.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'LinkedIn',
        category_id: professionalCategory?.id,
        start_time: new Date(today.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        end_time: new Date(today.getTime() - 7.5 * 60 * 60 * 1000).toISOString(), // 7.5 hours ago
        duration_minutes: 30,
        session_date: today.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'Rise and Bloom',
        category_id: professionalCategory?.id,
        start_time: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        end_time: new Date(today.getTime() - 0.5 * 60 * 60 * 1000).toISOString(), // 30 min ago
        duration_minutes: 30,
        session_date: today.toISOString().split('T')[0]
      }
    ];

    // Create sample app usage sessions for yesterday
    const yesterdaysSessions = [
      {
        user_id: userId,
        app_name: 'Instagram',
        category_id: socialCategory?.id,
        start_time: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(yesterday.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 30,
        session_date: yesterday.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'TikTok',
        category_id: entertainmentCategory?.id,
        start_time: new Date(yesterday.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(yesterday.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 30,
        session_date: yesterday.toISOString().split('T')[0]
      },
      {
        user_id: userId,
        app_name: 'YouTube',
        category_id: entertainmentCategory?.id,
        start_time: new Date(yesterday.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(yesterday.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        session_date: yesterday.toISOString().split('T')[0]
      }
    ];

    // Insert app usage sessions
    await supabase.from('app_usage_sessions').insert([...todaysSessions, ...yesterdaysSessions]);

    // Create daily device stats
    const dailyStats = [
      {
        user_id: userId,
        stat_date: today.toISOString().split('T')[0],
        total_screen_time_minutes: 180, // 3 hours
        total_pickups: 47,
        first_pickup_time: '07:30:00',
        last_activity_time: '23:15:00',
        longest_session_minutes: 60,
        focus_score: 7.2
      },
      {
        user_id: userId,
        stat_date: yesterday.toISOString().split('T')[0],
        total_screen_time_minutes: 120, // 2 hours
        total_pickups: 35,
        first_pickup_time: '08:00:00',
        last_activity_time: '22:30:00',
        longest_session_minutes: 60,
        focus_score: 8.1
      }
    ];

    await supabase.from('daily_device_stats').insert(dailyStats);

    // Create focus sessions
    const focusSessions = [
      {
        user_id: userId,
        start_time: new Date(today.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() - 9 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        session_type: 'focus',
        interruptions: 2,
        quality_rating: 4,
        notes: 'Good focus session, minimal distractions'
      },
      {
        user_id: userId,
        start_time: new Date(yesterday.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(yesterday.getTime() - 9 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 45,
        session_type: 'deep_work',
        interruptions: 1,
        quality_rating: 5,
        notes: 'Excellent deep work session'
      }
    ];

    await supabase.from('focus_sessions').insert(focusSessions);

    // Create digital wellbeing settings
    const settings = {
      user_id: userId,
      tracking_enabled: true,
      intentionality_prompts_enabled: true,
      break_reminders_enabled: true,
      break_interval_minutes: 30,
      daily_screen_time_goal_minutes: 480, // 8 hours
      focus_session_goal_minutes: 120, // 2 hours
      notification_settings: {
        screenTimeAlerts: true,
        focusReminders: true,
        pickupLimits: true
      }
    };

    await supabase.from('digital_wellbeing_settings').insert(settings);

    console.log('Demo digital wellbeing data created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating demo data:', error);
    return false;
  }
};

// Function to clear demo data
export const clearDemoDigitalWellbeingData = async (userId: string) => {
  try {
    await supabase.from('app_usage_sessions').delete().eq('user_id', userId);
    await supabase.from('daily_device_stats').delete().eq('user_id', userId);
    await supabase.from('focus_sessions').delete().eq('user_id', userId);
    await supabase.from('digital_wellbeing_settings').delete().eq('user_id', userId);
    
    console.log('Demo data cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return false;
  }
};