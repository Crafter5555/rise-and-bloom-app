import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  item_type: 'habit' | 'task' | 'activity' | 'workout' | 'routine';
  item_id: string;
  scheduled_time?: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDailyPlans = (date?: string) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const targetDate = date || new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchPlans();
      const channel = subscribeToDailyPlans();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setPlans([]);
      setLoading(false);
    }
  }, [user, targetDate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('plan_date', targetDate)
        .order('scheduled_time', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      console.error('Error fetching daily plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDailyPlans = (): RealtimeChannel => {
    const channel = supabase
      .channel('daily_plans_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_plans',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          const plan = payload.new as DailyPlan;
          if (plan.plan_date !== targetDate) return;

          if (payload.eventType === 'INSERT') {
            setPlans((prev) => [...prev, plan].sort((a, b) => {
              if (!a.scheduled_time) return 1;
              if (!b.scheduled_time) return -1;
              return a.scheduled_time.localeCompare(b.scheduled_time);
            }));
          } else if (payload.eventType === 'UPDATE') {
            setPlans((prev) =>
              prev.map((p) => (p.id === plan.id ? plan : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setPlans((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const addToPlan = async (
    itemType: DailyPlan['item_type'],
    itemId: string,
    scheduledTime?: string,
    planDate?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .insert({
          user_id: user!.id,
          plan_date: planDate || targetDate,
          item_type: itemType,
          item_id: itemId,
          scheduled_time: scheduledTime,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding to daily plan:', err);
      return { data: null, error: err.message };
    }
  };

  const updatePlan = async (id: string, updates: Partial<DailyPlan>) => {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
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
      console.error('Error updating daily plan:', err);
      return { data: null, error: err.message };
    }
  };

  const removePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error removing from daily plan:', err);
      return { error: err.message };
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      const plan = plans.find((p) => p.id === id);
      if (!plan) return { error: 'Plan not found' };

      const completed = !plan.completed;
      const completed_at = completed ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('daily_plans')
        .update({
          completed,
          completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error toggling plan completion:', err);
      return { data: null, error: err.message };
    }
  };

  const getPlansForDateRange = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user!.id)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate)
        .order('plan_date')
        .order('scheduled_time', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error fetching plans for date range:', err);
      return { data: [], error: err.message };
    }
  };

  const getCompletionStats = () => {
    const total = plans.length;
    const completed = plans.filter((p) => p.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      remaining: total - completed,
      completionRate,
    };
  };

  return {
    plans,
    loading,
    error,
    addToPlan,
    updatePlan,
    removePlan,
    toggleComplete,
    getPlansForDateRange,
    getCompletionStats,
    refetch: fetchPlans,
  };
};
