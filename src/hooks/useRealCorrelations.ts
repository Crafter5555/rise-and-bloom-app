import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CorrelationData {
  x: number;
  y: number;
  date: string;
}

export interface HabitCorrelation {
  habit: string;
  correlation: number;
  color: string;
}

export const useRealCorrelations = () => {
  const { user } = useAuth();

  const { data: moodProductivityData, isLoading: moodLoading } = useQuery({
    queryKey: ['mood-productivity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get mood entries and daily plan completion rates for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [moodResult, plansResult] = await Promise.all([
        supabase
          .from('mood_entries')
          .select('mood_score, entry_date')
          .eq('user_id', user.id)
          .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('entry_date'),
        
        supabase
          .from('daily_plans')
          .select('plan_date, completed')
          .eq('user_id', user.id)
          .gte('plan_date', thirtyDaysAgo.toISOString().split('T')[0])
      ]);

      const moodData = moodResult.data || [];
      const plansData = plansResult.data || [];

      // Calculate daily productivity rates
      const dailyProductivity = plansData.reduce((acc, plan) => {
        const date = plan.plan_date;
        if (!acc[date]) {
          acc[date] = { total: 0, completed: 0 };
        }
        acc[date].total++;
        if (plan.completed) acc[date].completed++;
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      // Combine mood and productivity data
      return moodData.map(mood => {
        const productivity = dailyProductivity[mood.entry_date];
        const productivityRate = productivity 
          ? (productivity.completed / productivity.total) * 100 
          : 0;

        return {
          x: mood.mood_score,
          y: productivityRate,
          date: mood.entry_date
        };
      });
    },
    enabled: !!user?.id
  });

  const { data: habitCorrelationData, isLoading: habitLoading } = useQuery({
    queryKey: ['habit-correlations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const [habitsResult, completionsResult, moodResult] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', true),
        
        supabase
          .from('habit_completions')
          .select('habit_id, completion_date')
          .eq('user_id', user.id)
          .gte('completion_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        supabase
          .from('mood_entries')
          .select('mood_score, entry_date')
          .eq('user_id', user.id)
          .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      const habits = habitsResult.data || [];
      const completions = completionsResult.data || [];
      const moodEntries = moodResult.data || [];

      // Calculate correlation between each habit and mood
      return habits.map((habit, index) => {
        const habitCompletions = completions.filter(c => c.habit_id === habit.id);
        
        // Simple correlation calculation based on mood scores on days habits were completed
        const completionDates = habitCompletions.map(c => c.completion_date);
        const moodOnCompletionDays = moodEntries.filter(m => 
          completionDates.includes(m.entry_date)
        );
        
        const avgMoodOnCompletionDays = moodOnCompletionDays.length > 0
          ? moodOnCompletionDays.reduce((sum, m) => sum + m.mood_score, 0) / moodOnCompletionDays.length
          : 0;
        
        const avgMoodOverall = moodEntries.length > 0
          ? moodEntries.reduce((sum, m) => sum + m.mood_score, 0) / moodEntries.length
          : 0;

        // Simple correlation score (difference from average)
        const correlation = avgMoodOverall > 0 
          ? Math.round(((avgMoodOnCompletionDays - avgMoodOverall) / avgMoodOverall) * 100)
          : 0;

        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];
        
        return {
          habit: habit.name,
          correlation: Math.max(-100, Math.min(100, correlation)),
          color: colors[index % colors.length]
        };
      });
    },
    enabled: !!user?.id
  });

  return {
    moodProductivityData: moodProductivityData || [],
    habitCorrelationData: habitCorrelationData || [],
    isLoading: moodLoading || habitLoading
  };
};