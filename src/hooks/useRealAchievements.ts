import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface UserProgress {
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  focus_score: number;
}

interface UserProgressDisplay {
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  focusScore: number;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_task',
    title: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    category: 'productivity',
    maxProgress: 1,
    xpReward: 10,
    rarity: 'common'
  },
  {
    id: 'week_streak',
    title: 'Consistent Performer',
    description: 'Complete tasks for 7 days in a row',
    icon: '🔥',
    category: 'streak',
    maxProgress: 7,
    xpReward: 50,
    rarity: 'rare'
  },
  {
    id: 'habit_master',
    title: 'Habit Master',
    description: 'Complete 100 habit instances',
    icon: '🏆',
    category: 'habits',
    maxProgress: 100,
    xpReward: 100,
    rarity: 'epic'
  },
  {
    id: 'goal_crusher',
    title: 'Goal Crusher',
    description: 'Complete 5 goals',
    icon: '💪',
    category: 'goals',
    maxProgress: 5,
    xpReward: 75,
    rarity: 'rare'
  },
  {
    id: 'productivity_legend',
    title: 'Productivity Legend',
    description: 'Maintain 95% task completion for a month',
    icon: '👑',
    category: 'productivity',
    maxProgress: 30,
    xpReward: 200,
    rarity: 'legendary'
  }
];

export const useRealAchievements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First update progress
      await supabase.rpc('update_user_progress', { target_user_id: user.id });

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? {
        level: data.level,
        totalXp: data.total_xp,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        focusScore: data.focus_score
      } as UserProgressDisplay : null;
    },
    enabled: !!user?.id
  });

  const { data: userAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: realTimeStats } = useQuery({
    queryKey: ['achievement-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [tasksResult, habitsResult, goalsResult] = await Promise.all([
        supabase.from('daily_plans').select('completed').eq('user_id', user.id),
        supabase.from('habit_completions').select('id').eq('user_id', user.id),
        supabase.from('goals').select('progress, target_value').eq('user_id', user.id)
      ]);

      const completedTasks = tasksResult.data?.filter(t => t.completed).length || 0;
      const habitCompletions = habitsResult.data?.length || 0;
      const completedGoals = goalsResult.data?.filter(g => (g.progress || 0) >= (g.target_value || 100)).length || 0;

      return {
        completedTasks,
        habitCompletions,
        completedGoals,
        currentStreak: userProgress?.currentStreak || 0
      };
    },
    enabled: !!user?.id
  });

  // Calculate achievements with real progress
  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
    const userAchievement = userAchievements?.find(ua => ua.achievement_id === def.id);
    let progress = 0;

    if (realTimeStats) {
      switch (def.id) {
        case 'first_task':
          progress = realTimeStats.completedTasks > 0 ? 1 : 0;
          break;
        case 'week_streak':
          progress = Math.min(realTimeStats.currentStreak, 7);
          break;
        case 'habit_master':
          progress = Math.min(realTimeStats.habitCompletions, 100);
          break;
        case 'goal_crusher':
          progress = Math.min(realTimeStats.completedGoals, 5);
          break;
        case 'productivity_legend':
          // This would need more complex calculation
          progress = userAchievement?.progress || 0;
          break;
      }
    }

    return {
      ...def,
      progress,
      unlocked: progress >= def.maxProgress,
      unlockedAt: userAchievement?.unlocked_at
    };
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement || !achievement.unlocked) return;

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: user.id,
          achievement_id: achievementId,
          progress: achievement.progress,
          max_progress: achievement.maxProgress,
          xp_earned: achievement.xpReward
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user?.id] });
    }
  });

  return {
    achievements,
    userProgress: userProgress || {
      level: 1,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      focusScore: 0
    },
    isLoading: progressLoading || achievementsLoading,
    unlockAchievement: unlockAchievementMutation.mutate
  };
};