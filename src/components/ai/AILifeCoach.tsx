import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Lightbulb, Target, Trophy, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    // Initialize with some AI insights
    setInsights([
      {
        type: 'motivation',
        title: 'Daily Momentum',
        message: "Your consistency in completing morning routines has improved by 40% this week. This shows incredible self-discipline!",
        icon: Trophy,
        color: 'text-yellow-500'
      },
      {
        type: 'pattern',
        title: 'Energy Pattern Detected',
        message: "I notice you're most productive between 9-11 AM. Consider scheduling your most important tasks during this window.",
        icon: Brain,
        color: 'text-blue-500'
      },
      {
        type: 'suggestion',
        title: 'Optimization Tip',
        message: "Based on your mood data, taking a 10-minute walk after lunch could boost your afternoon productivity by 25%.",
        icon: Lightbulb,
        color: 'text-green-500'
      }
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const responses = [
      {
        type: 'suggestion' as const,
        title: 'Personalized Recommendation',
        message: `Based on your question about "${userInput.substring(0, 30)}...", I recommend focusing on small, consistent actions. Start with just 5 minutes daily and build from there.`,
        icon: Target,
        color: 'text-purple-500'
      },
      {
        type: 'motivation' as const,
        title: 'Encouragement',
        message: "Remember, every expert was once a beginner. Your willingness to seek guidance shows you're already on the right path to growth.",
        icon: Trophy,
        color: 'text-yellow-500'
      }
    ];
    
    const newInsight = responses[Math.floor(Math.random() * responses.length)];
    setInsights(prev => [newInsight, ...prev]);
    setUserInput("");
    setIsLoading(false);
    
    toast({
      title: "AI Insight Generated",
      description: "Your personal life coach has analyzed your question.",
    });
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