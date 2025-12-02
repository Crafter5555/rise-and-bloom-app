import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_duration_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration_seconds: number;
  rest_seconds: number;
  order_index: number;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_date: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
      const channel = subscribeToWorkouts();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setWorkouts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (err: any) {
      console.error('Error fetching workouts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToWorkouts = (): RealtimeChannel => {
    const channel = supabase
      .channel('workouts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkouts((prev) => [payload.new as Workout, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setWorkouts((prev) =>
              prev.map((workout) =>
                workout.id === payload.new.id ? (payload.new as Workout) : workout
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setWorkouts((prev) => prev.filter((workout) => workout.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const createWorkout = async (workoutData: Omit<Workout, 'id' | 'user_id' | 'created_at' | 'updated_at'>, exercises?: Omit<WorkoutExercise, 'id' | 'workout_id' | 'created_at'>[]) => {
    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          ...workoutData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      if (exercises && exercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(
            exercises.map((ex) => ({
              ...ex,
              workout_id: workout.id,
            }))
          );

        if (exercisesError) throw exercisesError;
      }

      return { data: workout, error: null };
    } catch (err: any) {
      console.error('Error creating workout:', err);
      return { data: null, error: err.message };
    }
  };

  const updateWorkout = async (id: string, updates: Partial<Workout>) => {
    try {
      const { data, error } = await supabase
        .from('workouts')
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
      console.error('Error updating workout:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting workout:', err);
      return { error: err.message };
    }
  };

  const getWorkoutExercises = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('order_index');

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error fetching workout exercises:', err);
      return { data: [], error: err.message };
    }
  };

  const scheduleWorkout = async (workoutId: string, scheduledDate: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user!.id,
          workout_id: workoutId,
          scheduled_date: scheduledDate,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error scheduling workout:', err);
      return { data: null, error: err.message };
    }
  };

  const completeWorkoutPlan = async (planId: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error completing workout plan:', err);
      return { data: null, error: err.message };
    }
  };

  const getScheduledWorkouts = async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('workout_plans')
        .select('*, workouts(*)')
        .eq('user_id', user!.id)
        .order('scheduled_date');

      if (startDate) {
        query = query.gte('scheduled_date', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error fetching scheduled workouts:', err);
      return { data: [], error: err.message };
    }
  };

  return {
    workouts,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutExercises,
    scheduleWorkout,
    completeWorkoutPlan,
    getScheduledWorkouts,
    refetch: fetchWorkouts,
  };
};
