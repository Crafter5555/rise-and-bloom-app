import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  duration_minutes: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityCompletion {
  id: string;
  activity_id: string;
  user_id: string;
  completion_date: string;
  duration_minutes?: number;
  notes?: string;
  completed_at: string;
}

export const useActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
      const channel = subscribeToActivities();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setActivities([]);
      setLoading(false);
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = (): RealtimeChannel => {
    const channel = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActivities((prev) => [payload.new as Activity, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setActivities((prev) =>
              prev.map((activity) =>
                activity.id === payload.new.id ? (payload.new as Activity) : activity
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setActivities((prev) => prev.filter((activity) => activity.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const createActivity = async (activityData: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activityData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating activity:', err);
      return { data: null, error: err.message };
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating activity:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting activity:', err);
      return { error: err.message };
    }
  };

  const completeActivity = async (activityId: string, durationMinutes?: number, notes?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('activity_completions')
        .insert({
          activity_id: activityId,
          user_id: user!.id,
          completion_date: today,
          duration_minutes: durationMinutes,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error completing activity:', err);
      return { data: null, error: err.message };
    }
  };

  const getActivityCompletions = async (activityId: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('activity_completions')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', user!.id)
        .order('completion_date', { ascending: false });

      if (startDate) {
        query = query.gte('completion_date', startDate);
      }
      if (endDate) {
        query = query.lte('completion_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error fetching activity completions:', err);
      return { data: [], error: err.message };
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const activity = activities.find((a) => a.id === id);
      if (!activity) return { error: 'Activity not found' };

      const { data, error } = await supabase
        .from('activities')
        .update({
          is_favorite: !activity.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      return { data: null, error: err.message };
    }
  };

  const getFavoriteActivities = () => {
    return activities.filter((activity) => activity.is_favorite);
  };

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    getActivityCompletions,
    toggleFavorite,
    getFavoriteActivities,
    refetch: fetchActivities,
  };
};
