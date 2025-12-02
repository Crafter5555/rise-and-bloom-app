import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_count?: number;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
  notes?: string;
}

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHabits();
      const channel = subscribeToHabits();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setHabits([]);
      setLoading(false);
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (err: any) {
      console.error('Error fetching habits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToHabits = (): RealtimeChannel => {
    const channel = supabase
      .channel('habits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHabits((prev) => [payload.new as Habit, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setHabits((prev) =>
              prev.map((habit) =>
                habit.id === payload.new.id ? (payload.new as Habit) : habit
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setHabits((prev) => prev.filter((habit) => habit.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const createHabit = async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_streak' | 'longest_streak'>) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habitData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating habit:', err);
      return { data: null, error: err.message };
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const { data, error } = await supabase
        .from('habits')
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
      console.error('Error updating habit:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting habit:', err);
      return { error: err.message };
    }
  };

  const completeHabit = async (habitId: string, completionDate?: string, notes?: string) => {
    try {
      const date = completionDate || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user!.id,
          completion_date: date,
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error completing habit:', err);
      return { data: null, error: err.message };
    }
  };

  const uncompleteHabit = async (habitId: string, completionDate?: string) => {
    try {
      const date = completionDate || new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user!.id)
        .eq('completion_date', date);

      if (error) throw error;

      await fetchHabits();

      return { error: null };
    } catch (err: any) {
      console.error('Error uncompleting habit:', err);
      return { error: err.message };
    }
  };

  const getHabitCompletions = async (habitId: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
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
      console.error('Error fetching habit completions:', err);
      return { data: [], error: err.message };
    }
  };

  const isHabitCompletedToday = async (habitId: string): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user!.id)
        .eq('completion_date', today)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    getHabitCompletions,
    isHabitCompletedToday,
    refetch: fetchHabits,
  };
};
