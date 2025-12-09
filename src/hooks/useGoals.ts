import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  status: 'active' | 'completed' | 'archived';
  progress: number;
  target_value: number;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGoals();
      const channel = subscribeToGoals();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setGoals([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as Goal[]);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToGoals = (): RealtimeChannel => {
    const channel = supabase
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals((prev) => [payload.new as Goal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setGoals((prev) =>
              prev.map((goal) =>
                goal.id === payload.new.id ? (payload.new as Goal) : goal
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGoals((prev) => prev.filter((goal) => goal.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const createGoal = async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating goal:', err);
      return { data: null, error: err.message };
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
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
      console.error('Error updating goal:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      return { error: err.message };
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const status = progress >= 100 ? 'completed' : 'active';

      const { data, error } = await supabase
        .from('goals')
        .update({
          progress: Math.min(progress, 100),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating goal progress:', err);
      return { data: null, error: err.message };
    }
  };

  const getActiveGoals = () => {
    return goals.filter((goal) => goal.status === 'active');
  };

  const getCompletedGoals = () => {
    return goals.filter((goal) => goal.status === 'completed');
  };

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    getActiveGoals,
    getCompletedGoals,
    refetch: fetchGoals,
  };
};
