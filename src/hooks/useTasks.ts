import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
      const channel = subscribeToTasks();
      return () => {
        channel.unsubscribe();
      };
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTasks = (): RealtimeChannel => {
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating task:', err);
      return { data: null, error: err.message };
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
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
      console.error('Error updating task:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting task:', err);
      return { error: err.message };
    }
  };

  const toggleTaskComplete = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return { error: 'Task not found' };

      const completed = !task.completed;
      const completed_at = completed ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('tasks')
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
      console.error('Error toggling task:', err);
      return { data: null, error: err.message };
    }
  };

  const getTasksByCategory = (category: string) => {
    return tasks.filter((task) => task.category === category);
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (task) => task.due_date === today && !task.completed
    );
  };

  const getOverdueTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (task) => task.due_date && task.due_date < today && !task.completed
    );
  };

  const getUpcomingTasks = (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    return tasks.filter(
      (task) =>
        task.due_date &&
        task.due_date > todayStr &&
        task.due_date <= futureStr &&
        !task.completed
    );
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    getTasksByCategory,
    getTodayTasks,
    getOverdueTasks,
    getUpcomingTasks,
    refetch: fetchTasks,
  };
};
