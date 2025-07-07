import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAutoScheduling = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateAllDailyPlans = async (startDate?: Date, daysAhead = 7) => {
    if (!user) return null;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_all_daily_plans', {
        target_user_id: user.id,
        start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
        days_ahead: daysAhead
      });

      if (error) throw error;

      const result = data as {
        total_created: number;
        habits_created: number;
        activities_created: number;
        goals_created: number;
        workouts_created: number;
      };

      if (result.total_created > 0) {
        toast({
          title: "Auto-scheduling Complete!",
          description: `Created ${result.total_created} daily plans (${result.habits_created} habits, ${result.activities_created} activities, ${result.goals_created} goals, ${result.workouts_created} workouts)`
        });
      } else {
        toast({
          title: "No New Plans Created",
          description: "All your items are already scheduled for the selected period."
        });
      }

      return result;
    } catch (error) {
      console.error('Error generating daily plans:', error);
      toast({
        title: "Error",
        description: "Failed to generate automatic daily plans. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateHabitPlans = async (startDate?: Date, daysAhead = 7) => {
    if (!user) return null;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_daily_habit_plans', {
        target_user_id: user.id,
        start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
        days_ahead: daysAhead
      });

      if (error) throw error;

      toast({
        title: "Habit Plans Generated",
        description: `Created ${data} habit plans for the next ${daysAhead} days`
      });

      return data;
    } catch (error) {
      console.error('Error generating habit plans:', error);
      toast({
        title: "Error",
        description: "Failed to generate habit plans. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateActivityPlans = async (startDate?: Date, daysAhead = 7) => {
    if (!user) return null;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_daily_activity_plans', {
        target_user_id: user.id,
        start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
        days_ahead: daysAhead
      });

      if (error) throw error;

      toast({
        title: "Activity Plans Generated",
        description: `Created ${data} activity plans for the next ${daysAhead} days`
      });

      return data;
    } catch (error) {
      console.error('Error generating activity plans:', error);
      toast({
        title: "Error",
        description: "Failed to generate activity plans. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateGoalPlans = async (startDate?: Date, daysAhead = 7) => {
    if (!user) return null;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_daily_goal_plans', {
        target_user_id: user.id,
        start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
        days_ahead: daysAhead
      });

      if (error) throw error;

      toast({
        title: "Goal Plans Generated",
        description: `Created ${data} goal plans for the next ${daysAhead} days`
      });

      return data;
    } catch (error) {
      console.error('Error generating goal plans:', error);
      toast({
        title: "Error",
        description: "Failed to generate goal plans. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateAllDailyPlans,
    generateHabitPlans,
    generateActivityPlans,
    generateGoalPlans
  };
};