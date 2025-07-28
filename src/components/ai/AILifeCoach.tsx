import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Lightbulb, Target, Trophy, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AIInsight {
  type: 'motivation' | 'pattern' | 'suggestion' | 'achievement';
  title: string;
  message: string;
  icon: any;
  color: string;
}

export const AILifeCoach = () => {
  const [userInput, setUserInput] = useState("");
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadInitialInsights();
  }, []);

  const loadInitialInsights = async () => {
    if (!user) return;
    
    try {
      // Generate fresh insights from user data
      await supabase.rpc('update_user_progress', { target_user_id: user.id });
      await supabase.rpc('generate_behavior_insights', { target_user_id: user.id });
      
      // Load existing insights
      const { data: behaviorInsights } = await supabase
        .from('behavior_insights')
        .select('*')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (behaviorInsights && behaviorInsights.length > 0) {
        const formattedInsights = behaviorInsights.map(insight => ({
          type: insight.insight_type as 'motivation' | 'pattern' | 'suggestion' | 'achievement',
          title: insight.title,
          message: insight.description,
          icon: getInsightIcon(insight.insight_type),
          color: getInsightColor(insight.insight_type)
        }));
        setInsights(formattedInsights);
      } else {
        // Fallback to default insights if no data available
        setInsights([
          {
            type: 'motivation',
            title: 'Welcome to Your AI Coach',
            message: "I'm here to help you build better habits and achieve your goals. Complete a few tasks to unlock personalized insights!",
            icon: Brain,
            color: 'text-blue-500'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading initial insights:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return Brain;
      case 'recommendation': case 'suggestion': return Lightbulb;
      case 'celebration': case 'achievement': return Trophy;
      default: return Target;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'text-blue-500';
      case 'recommendation': case 'suggestion': return 'text-green-500';
      case 'celebration': case 'achievement': return 'text-yellow-500';
      default: return 'text-purple-500';
    }
  };
  const handleSendMessage = async () => {
    if (!userInput.trim() || !user) return;
    
    setIsLoading(true);
    
    try {
      // Generate contextual response based on user data and question
      await supabase.rpc('update_user_progress', { target_user_id: user.id });
      
      // Create a contextual insight based on the user's question
      const contextualInsight = await generateContextualResponse(userInput);
      
      setInsights(prev => [contextualInsight, ...prev.slice(0, 4)]); // Keep max 5 insights
      setUserInput("");
      
      toast({
        title: "AI Coach Response",
        description: "I've analyzed your question and provided personalized guidance.",
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: "Unable to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateContextualResponse = async (question: string): Promise<AIInsight> => {
    // Analyze user's recent activity to provide contextual advice
    const { data: recentPlans } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user!.id)
      .gte('plan_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('plan_date', { ascending: false });
    
    const completionRate = recentPlans && recentPlans.length > 0 
      ? (recentPlans.filter(p => p.completed).length / recentPlans.length) * 100 
      : 0;
    
    // Generate contextual responses based on question keywords and user data
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('habit') || questionLower.includes('routine')) {
      return {
        type: 'suggestion',
        title: 'Habit Building Strategy',
        message: `Based on your ${Math.round(completionRate)}% completion rate, I recommend starting with just 2-3 core habits. Focus on consistency over quantity - even 5 minutes daily builds neural pathways.`,
        icon: Target,
        color: 'text-green-500'
      };
    } else if (questionLower.includes('motivation') || questionLower.includes('stuck')) {
      return {
        type: 'motivation',
        title: 'Motivation Boost',
        message: `You've completed ${recentPlans?.filter(p => p.completed).length || 0} tasks recently! Remember, motivation gets you started, but habit keeps you going. Small wins compound into big changes.`,
        icon: Trophy,
        color: 'text-yellow-500'
      };
    } else if (questionLower.includes('goal') || questionLower.includes('achieve')) {
      return {
        type: 'pattern',
        title: 'Goal Achievement Insight',
        message: `Break your goal into daily actions. Your current completion rate suggests focusing on 1-2 key actions per day rather than overwhelming yourself with too many tasks.`,
        icon: Brain,
        color: 'text-blue-500'
      };
    } else {
      return {
        type: 'suggestion',
        title: 'Personalized Guidance',
        message: `Based on your recent activity, I suggest focusing on consistency. You're doing well with a ${Math.round(completionRate)}% completion rate. Keep building momentum with small, daily actions.`,
        icon: Lightbulb,
        color: 'text-purple-500'
      };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Life Coach
        </CardTitle>
        <CardDescription>
          Get personalized insights and guidance for your self-improvement journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Ask your AI life coach anything about habits, goals, motivation, or personal growth..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!userInput.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is thinking...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Ask AI Coach
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Recent AI Insights</h4>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <insight.icon className={`h-4 w-4 ${insight.color}`} />
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ask your first question to get personalized AI insights
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};