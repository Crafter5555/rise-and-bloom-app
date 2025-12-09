import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Prediction {
  id: string;
  type: 'habit_completion' | 'goal_achievement' | 'streak_break' | 'energy_dip';
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  confidence: number;
  actionable: boolean;
  suggestion?: string;
}

export interface PatternInsight {
  pattern: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;
  description: string;
}

export const useRealPredictiveAnalytics = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictive-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      try {
        const { data: predictionData } = await (supabase as any)
          .from('prediction_models')
          .select('*')
          .eq('user_id', user.id)
          .gte('target_date', new Date().toISOString().split('T')[0])
          .lte('target_date', nextWeek.toISOString().split('T')[0])
          .order('target_date');

        if (!predictionData || predictionData.length === 0) {
          return [];
        }

        const predictions: Prediction[] = predictionData.map((pred: any) => {
          const daysUntil = Math.ceil(
            (new Date(pred.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          const timeframe = daysUntil === 0 ? 'Today' :
                           daysUntil === 1 ? 'Tomorrow' :
                           `In ${daysUntil} days`;

          let type: Prediction['type'] = 'goal_achievement';
          let title = '';
          let description = '';
          let suggestion = '';

          switch (pred.prediction_type) {
            case 'daily_completion_rate':
              type = 'goal_achievement';
              title = 'Daily Completion Forecast';
              description = `Based on your recent patterns, you're likely to complete ${Math.round(pred.prediction_value)}% of tasks ${timeframe.toLowerCase()}`;
              suggestion = pred.prediction_value < 70
                ? 'Plan fewer, more achievable tasks to build momentum'
                : 'You\'re on track! Keep your current planning approach';
              break;

            case 'habit_completion':
              type = 'habit_completion';
              title = 'Habit Streak Continuation';
              description = `${Math.round(pred.probability * 100)}% chance of maintaining your habit streak ${timeframe.toLowerCase()}`;
              suggestion = pred.probability < 0.7
                ? 'Set a reminder and prepare your environment in advance'
                : 'Great momentum! Your habits are becoming automatic';
              break;

            case 'energy_dip_risk':
              type = 'energy_dip';
              title = 'Energy Level Alert';
              description = `Potential energy dip detected for ${timeframe.toLowerCase()} based on recent mood patterns`;
              suggestion = 'Schedule lighter tasks and plan a midday break or walk';
              break;

            case 'streak_break':
              type = 'streak_break';
              title = 'Streak Risk Warning';
              description = `${Math.round(pred.probability * 100)}% risk of breaking your current streak this weekend`;
              suggestion = 'Set up weekend-specific reminders and smaller habit versions';
              break;

            default:
              title = 'Behavioral Prediction';
              description = `Prediction for ${pred.prediction_type}`;
          }

          return {
            id: pred.id,
            type,
            title,
            description,
            probability: Math.round(pred.prediction_value),
            timeframe,
            confidence: Math.round(pred.probability * 100),
            actionable: pred.probability < 0.8,
            suggestion: suggestion || undefined
          };
        });

        return predictions;
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['behavioral-patterns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const [patternsResult, correlationsResult] = await Promise.all([
          (supabase as any)
            .from('behavioral_patterns')
            .select('pattern_type, pattern_data, confidence_score, occurrences')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('confidence_score', { ascending: false }),
          Promise.resolve({ data: [] }) // Skip RPC call that doesn't exist
        ]);

        const behavioralPatterns = patternsResult.data || [];
        const correlations = correlationsResult.data || [];

        const patterns: PatternInsight[] = [];

        correlations.forEach((corr: any) => {
          if (corr.correlation_coefficient !== null && Math.abs(corr.correlation_coefficient) > 0.3) {
            patterns.push({
              pattern: `${corr.factor_a} → ${corr.factor_b}`,
              impact: corr.correlation_coefficient > 0 ? 'positive' : 'negative',
              strength: Math.round(Math.abs(corr.correlation_coefficient) * 100),
              description: corr.correlation_coefficient > 0
                ? `Higher ${corr.factor_a.toLowerCase()} correlates with better ${corr.factor_b.toLowerCase()} (${corr.significance})`
                : `Higher ${corr.factor_a.toLowerCase()} correlates with lower ${corr.factor_b.toLowerCase()} (${corr.significance})`
            });
          }
        });

        behavioralPatterns.forEach((pattern: any) => {
          const data = pattern.pattern_data || {};
          patterns.push({
            pattern: pattern.pattern_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            impact: data.impact || 'neutral',
            strength: Math.round(pattern.confidence_score * 100),
            description: data.description || `Detected ${pattern.occurrences} times with ${Math.round(pattern.confidence_score * 100)}% confidence`
          });
        });

        return patterns.slice(0, 6);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      // Try to run analysis, gracefully handle missing functions
      try {
        const insightsResult = await supabase.rpc('generate_behavior_insights', { target_user_id: user.id });
        if (insightsResult.error) console.warn('generate_behavior_insights not available');
        return { insights: insightsResult.data, predictions: null };
      } catch {
        return { insights: null, predictions: null };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive-analytics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['behavioral-patterns', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['real-insights', user?.id] });
    }
  });

  return {
    predictions: predictions || [],
    patterns: patterns || [],
    isLoading: predictionsLoading || patternsLoading,
    runAnalysis: runAnalysisMutation.mutate,
    isAnalyzing: runAnalysisMutation.isPending
  };
};
