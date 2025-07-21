
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Sparkles, TrendingUp, Target } from "lucide-react";
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

  // Mock AI insights based on user patterns
  useEffect(() => {
    const mockInsights: AIInsight[] = [
      {
        type: 'pattern',
        title: 'Energy Pattern Detected',
        message: 'You tend to be most productive between 9-11 AM. Consider scheduling your most important tasks during this window.',
        icon: TrendingUp,
        color: 'text-blue-600'
      },
      {
        type: 'suggestion',
        title: 'Habit Stack Opportunity',
        message: 'You could pair your morning meditation with journaling since you already have a strong morning routine.',
        icon: Target,
        color: 'text-green-600'
      },
      {
        type: 'achievement',
        title: 'Consistency Win',
        message: 'Amazing! You\'ve maintained your exercise habit for 12 days straight. Your dedication is paying off.',
        icon: Sparkles,
        color: 'text-purple-600'
      }
    ];
    
    setInsights(mockInsights);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response based on input
      const responses = [
        "I understand you're looking for guidance. Based on your current habits, I'd suggest focusing on consistency over perfection. Small daily actions compound into remarkable results.",
        "Your progress shows great potential. The key is to build on your existing momentum while gradually introducing new positive habits.",
        "I notice you're being hard on yourself. Remember, personal growth is a journey, not a destination. Celebrate your small wins along the way.",
        "Your patterns suggest you respond well to morning routines. Consider adding a brief mindfulness practice to enhance your existing schedule."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const newInsight: AIInsight = {
        type: 'motivation',
        title: 'AI Coach Response',
        message: randomResponse,
        icon: Brain,
        color: 'text-indigo-600'
      };
      
      setInsights(prev => [newInsight, ...prev].slice(0, 5)); // Keep only 5 latest
      setUserInput("");
      
      toast({
        title: "AI Coach responded",
        description: "Your personal insights have been updated.",
      });
      
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to connect to AI coach. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          AI Life Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Input */}
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask your AI coach anything about habits, goals, or personal growth..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            size="icon"
            className="h-[60px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <IconComponent className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {insights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Ask your AI coach a question to get personalized insights
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
