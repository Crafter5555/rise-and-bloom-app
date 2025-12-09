import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  routine_type: 'morning' | 'evening' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineStep {
  id: string;
  routine_id: string;
  step_name: string;
  duration_minutes: number;
  order_index: number;
  is_completed: boolean;
  created_at: string;
}

export const useRoutines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRoutines();
      const channel = subscribeToRoutines();
      return () => { channel.unsubscribe(); };
    } else {
      setRoutines([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('routines')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines((data || []) as Routine[]);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRoutines = (): RealtimeChannel => {
    const channel = supabase
      .channel('routines_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${user!.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setRoutines((prev) => [payload.new as Routine, ...prev]);
          else if (payload.eventType === 'UPDATE') setRoutines((prev) => prev.map((r) => r.id === payload.new.id ? (payload.new as Routine) : r));
          else if (payload.eventType === 'DELETE') setRoutines((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      ).subscribe();
    return channel;
  };

  const createRoutine = async (routineData: Omit<Routine, 'id' | 'user_id' | 'created_at' | 'updated_at'>, steps?: Omit<RoutineStep, 'id' | 'routine_id' | 'created_at' | 'is_completed'>[]) => {
    try {
      const { data: routine, error: routineError } = await (supabase as any).from('routines').insert({ ...routineData, user_id: user!.id }).select().single();
      if (routineError) throw routineError;
      if (steps && steps.length > 0) {
        const { error: stepsError } = await (supabase as any).from('routine_steps').insert(steps.map((step) => ({ ...step, routine_id: routine.id })));
        if (stepsError) throw stepsError;
      }
      return { data: routine, error: null };
    } catch (err: any) { return { data: null, error: err.message }; }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      const { data, error } = await (supabase as any).from('routines').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) { return { data: null, error: err.message }; }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('routines').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      return { error: null };
    } catch (err: any) { return { error: err.message }; }
  };

  const getRoutineSteps = async (routineId: string) => {
    try {
      const { data, error } = await (supabase as any).from('routine_steps').select('*').eq('routine_id', routineId).order('order_index');
      if (error) throw error;
      return { data: (data || []) as RoutineStep[], error: null };
    } catch (err: any) { return { data: [], error: err.message }; }
  };

  const addRoutineStep = async (routineId: string, step: Omit<RoutineStep, 'id' | 'routine_id' | 'created_at' | 'is_completed'>) => {
    try {
      const { data, error } = await (supabase as any).from('routine_steps').insert({ ...step, routine_id: routineId }).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) { return { data: null, error: err.message }; }
  };

  const updateRoutineStep = async (stepId: string, updates: Partial<RoutineStep>) => {
    try {
      const { data, error } = await (supabase as any).from('routine_steps').update(updates).eq('id', stepId).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) { return { data: null, error: err.message }; }
  };

  const deleteRoutineStep = async (stepId: string) => {
    try {
      const { error } = await (supabase as any).from('routine_steps').delete().eq('id', stepId);
      if (error) throw error;
      return { error: null };
    } catch (err: any) { return { error: err.message }; }
  };

  return { routines, loading, error, createRoutine, updateRoutine, deleteRoutine, getRoutineSteps, addRoutineStep, updateRoutineStep, deleteRoutineStep, getMorningRoutines: () => routines.filter((r) => r.routine_type === 'morning' && r.is_active), getEveningRoutines: () => routines.filter((r) => r.routine_type === 'evening' && r.is_active), refetch: fetchRoutines };
};
