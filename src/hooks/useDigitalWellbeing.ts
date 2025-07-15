import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AppUsageSession {
  id: string;
  app_name: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  session_date: string;
  category_id?: string;
}

interface DailyDeviceStats {
  id: string;
  stat_date: string;
  total_screen_time_minutes: number;
  total_pickups: number;
  first_pickup_time?: string;
  last_activity_time?: string;
  longest_session_minutes: number;
  focus_score: number;
}

interface FocusSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  session_type: string;
  interruptions: number;
  quality_rating?: number;
  notes?: string;
}

export const useDigitalWellbeing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // App Usage Tracking
  const startAppSession = async (appName: string, categoryId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('app_usage_sessions')
        .insert({
          user_id: user.id,
          app_name: appName,
          category_id: categoryId,
          start_time: new Date().toISOString(),
          session_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error starting app session:', err);
      setError('Failed to start app session');
      return null;
    }
  };

  const endAppSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const endTime = new Date();
      const { data: session } = await supabase
        .from('app_usage_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single();

      if (session) {
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        const { error } = await supabase
          .from('app_usage_sessions')
          .update({
            end_time: endTime.toISOString(),
            duration_minutes: durationMinutes
          })
          .eq('id', sessionId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error ending app session:', err);
      setError('Failed to end app session');
    }
  };

  // Daily Stats Management
  const updateDailyStats = async (statsUpdate: Partial<DailyDeviceStats>) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_device_stats')
        .upsert({
          user_id: user.id,
          stat_date: today,
          ...statsUpdate
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating daily stats:', err);
      setError('Failed to update daily stats');
    }
  };

  // Focus Session Management
  const startFocusSession = async (sessionType: string = 'focus') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          session_type: sessionType,
          interruptions: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error starting focus session:', err);
      setError('Failed to start focus session');
      return null;
    }
  };

  const endFocusSession = async (sessionId: string, qualityRating?: number, notes?: string) => {
    if (!user) return;

    try {
      const endTime = new Date();
      const { data: session } = await supabase
        .from('focus_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single();

      if (session) {
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        const { error } = await supabase
          .from('focus_sessions')
          .update({
            end_time: endTime.toISOString(),
            duration_minutes: durationMinutes,
            quality_rating: qualityRating,
            notes: notes
          })
          .eq('id', sessionId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error ending focus session:', err);
      setError('Failed to end focus session');
    }
  };

  // Track phone pickup
  const trackPhonePickup = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      // Get current daily stats
      const { data: currentStats } = await supabase
        .from('daily_device_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('stat_date', today)
        .single();

      const totalPickups = (currentStats?.total_pickups || 0) + 1;
      const firstPickupTime = currentStats?.first_pickup_time || currentTime;

      await updateDailyStats({
        total_pickups: totalPickups,
        first_pickup_time: firstPickupTime,
        last_activity_time: currentTime
      });
    } catch (err) {
      console.error('Error tracking phone pickup:', err);
    }
  };

  // Get user's digital wellbeing settings
  const getSettings = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('digital_wellbeing_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Error fetching settings:', err);
      return null;
    }
  };

  // Update user's digital wellbeing settings
  const updateSettings = async (settings: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('digital_wellbeing_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    }
  };

  return {
    loading,
    error,
    startAppSession,
    endAppSession,
    updateDailyStats,
    startFocusSession,
    endFocusSession,
    trackPhonePickup,
    getSettings,
    updateSettings
  };
};