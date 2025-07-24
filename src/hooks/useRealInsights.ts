import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RealInsight {
  id: string;
  insight_type: 'pattern' | 'recommendation' | 'warning' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  category: string;
  data_points?: any;
  created_at: string;
  expires_at: string;
}

export const useRealInsights = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['real-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('behavior_insights')
        .select('*')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RealInsight[];
    },
    enabled: !!user?.id
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('generate_behavior_insights', {
        target_user_id: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-insights', user?.id] });
    }
  });

  return {
    insights: insights || [],
    isLoading,
    error,
    generateInsights: generateInsightsMutation.mutate,
    isGenerating: generateInsightsMutation.isPending
  };
};