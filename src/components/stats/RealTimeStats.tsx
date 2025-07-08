import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, startOfMonth, subDays } from "date-fns";
import { Calendar, Target, TrendingUp, Award } from "lucide-react";

interface StatsData {
  todayCompleted: number;
  todayTotal: number;
  weeklyStreak: number;
  monthlyProgress: number;
  totalHabits: number;
  activeTasks: number;
  completedTasks: number;
  lastSyncTime: string;
}

export const RealTimeStats = () => {
  const [stats, setStats] = useState<StatsData>({
    todayCompleted: 0,
    todayTotal: 0,
    weeklyStreak: 0,
    monthlyProgress: 0,
    totalHabits: 0,
    activeTasks: 0,
    completedTasks: 0,
    lastSyncTime: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRealTimeStats = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Get today's plan completion
      const { data: todayPlans, error: todayError } = await supabase
        .from('daily_plans')
        .select('completed')
        .eq('user_id', user.id)
        .eq('plan_date', today);

      if (todayError) throw todayError;

      const todayCompleted = todayPlans?.filter(p => p.completed).length || 0;
      const todayTotal = todayPlans?.length || 0;

      // Get active habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (habitsError) throw habitsError;

      // Get tasks completion
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('completed')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      const completedTasks = tasks?.filter(t => t.completed).length || 0;
      const activeTasks = tasks?.filter(t => !t.completed).length || 0;

      // Calculate weekly streak (simplified - days with at least 1 completion)
      const last7Days = Array.from({ length: 7 }, (_, i) => 
        format(subDays(new Date(), i), 'yyyy-MM-dd')
      );

      let streak = 0;
      for (const date of last7Days) {
        const { data: dayPlans } = await supabase
          .from('daily_plans')
          .select('completed')
          .eq('user_id', user.id)
          .eq('plan_date', date);

        const hasCompletions = dayPlans?.some(p => p.completed);
        if (hasCompletions) {
          streak++;
        } else {
          break; // Streak broken
        }
      }

      // Calculate monthly progress
      const { data: monthPlans, error: monthError } = await supabase
        .from('daily_plans')
        .select('completed')
        .eq('user_id', user.id)
        .gte('plan_date', monthStart);

      if (monthError) throw monthError;

      const monthCompleted = monthPlans?.filter(p => p.completed).length || 0;
      const monthTotal = monthPlans?.length || 0;
      const monthlyProgress = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

      setStats({
        todayCompleted,
        todayTotal,
        weeklyStreak: streak,
        monthlyProgress,
        totalHabits: habits?.length || 0,
        activeTasks,
        completedTasks,
        lastSyncTime: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('stats-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchRealTimeStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const todayProgress = stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Today's Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">Today's Progress</span>
          </div>
          <Badge variant="outline">
            {stats.todayCompleted}/{stats.todayTotal}
          </Badge>
        </div>
        <Progress value={todayProgress} className="mb-2" />
        <div className="text-sm text-muted-foreground">
          {todayProgress}% complete
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Weekly Streak</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.weeklyStreak}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.weeklyStreak === 1 ? 'day' : 'days'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Monthly</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.monthlyProgress}%
          </div>
          <div className="text-xs text-muted-foreground">
            completion rate
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Active Habits</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalHabits}
          </div>
          <div className="text-xs text-muted-foreground">
            tracking daily
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium">Tasks</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.activeTasks}
          </div>
          <div className="text-xs text-muted-foreground">
            remaining ({stats.completedTasks} done)
          </div>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {format(new Date(stats.lastSyncTime), 'HH:mm:ss')}
      </div>
    </div>
  );
};