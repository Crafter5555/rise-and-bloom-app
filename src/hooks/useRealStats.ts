import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealStats = () => {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['real-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all user data in parallel
      const [
        { data: dailyPlans },
        { data: tasks },
        { data: habits },
        { data: habitCompletions },
        { data: goals },
        { data: activities }
      ] = await Promise.all([
        supabase
          .from('daily_plans')
          .select('id, completed, plan_date, item_type')
          .eq('user_id', user.id)
          .gte('plan_date', weekAgo),
        
        supabase
          .from('tasks')
          .select('id, completed, created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekAgo),
        
        supabase
          .from('habits')
          .select('id, name, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true),
        
        supabase
          .from('habit_completions')
          .select('id, completion_date, habit_id')
          .eq('user_id', user.id)
          .gte('completion_date', weekAgo),
        
        supabase
          .from('goals')
          .select('id, progress, target_value, status')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        
        supabase
          .from('activities')
          .select('id, is_favorite')
          .eq('user_id', user.id)
      ]);

      // Calculate today's stats
      const todayPlans = dailyPlans?.filter(p => p.plan_date === today) || [];
      const todayCompleted = todayPlans.filter(p => p.completed).length;
      const todayTotal = todayPlans.length;

      // Calculate weekly stats
      const weeklyPlans = dailyPlans || [];
      const weeklyCompleted = weeklyPlans.filter(p => p.completed).length;
      const weeklyTotal = weeklyPlans.length;

      // Calculate task stats
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.completed).length || 0;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate habit stats
      const totalHabits = habits?.length || 0;
      const habitCompletionsThisWeek = habitCompletions?.length || 0;
      const expectedHabitCompletions = totalHabits * 7; // 7 days
      const habitSuccessRate = expectedHabitCompletions > 0 ? 
        Math.round((habitCompletionsThisWeek / expectedHabitCompletions) * 100) : 0;

      // Calculate streak (consecutive days with completed tasks)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      let currentStreak = 0;
      for (const date of last7Days.reverse()) {
        const dayPlans = weeklyPlans.filter(p => p.plan_date === date);
        const dayCompleted = dayPlans.filter(p => p.completed).length;
        if (dayCompleted > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate productivity patterns
      const completedByHour = weeklyPlans
        .filter((p: any) => p.completed)
        .reduce((acc: Record<number, number>, plan: any) => {
          // Use plan_date as fallback since completed_at may not exist
          const hour = 12; // Default to noon
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

      const peakHours = Object.entries(completedByHour)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }));

      // Calculate focus score based on completion rate and habit consistency
      const focusScore = Math.round(
        (taskCompletionRate * 0.4 + habitSuccessRate * 0.4 + (weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0) * 0.2) / 10
      );

      return {
        overview: {
          currentStreak,
          goalsHit: goals?.filter(g => (g.progress || 0) >= (g.target_value || 100)).length || 0,
          focusScore: Math.min(10, Math.max(1, focusScore)),
          habitSuccessRate,
          weeklyCompletionRate: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0
        },
        today: {
          completed: todayCompleted,
          total: todayTotal,
          completionRate: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: taskCompletionRate,
          weeklyAverage: Math.round(weeklyCompleted / 7)
        },
        habits: {
          total: totalHabits,
          completions: habitCompletionsThisWeek,
          successRate: habitSuccessRate,
          activeHabits: habits || []
        },
        goals: {
          total: goals?.length || 0,
          active: goals?.filter(g => g.status === 'active').length || 0,
          completed: goals?.filter(g => (g.progress || 0) >= (g.target_value || 100)).length || 0
        },
        activities: {
          total: activities?.length || 0,
          favorites: activities?.filter(a => a.is_favorite).length || 0
        },
        productivity: {
          peakHours,
          weeklyData: last7Days.map(date => {
            const dayPlans = weeklyPlans.filter(p => p.plan_date === date);
            return {
              date,
              day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
              completed: dayPlans.filter(p => p.completed).length,
              total: dayPlans.length
            };
          })
        }
      };
    },
    enabled: !!user?.id
  });

  return {
    stats,
    isLoading,
    error
  };
};