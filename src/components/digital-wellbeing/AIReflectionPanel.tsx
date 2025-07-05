import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Target, Lightbulb } from "lucide-react";

export const AIReflectionPanel = () => {
  const [currentReflection, setCurrentReflection] = useState("");
  const [showFullCoach, setShowFullCoach] = useState(false);

  // Mock AI insights and suggestions
  const aiInsights = [
    {
      type: "pattern",
      icon: "🔍",
      title: "Pattern Detected",
      message: "You tend to open Instagram when feeling bored or during transitions. This happened 8 times today.",
      confidence: 87,
      action: "Try the 5-minute rule: wait 5 minutes before opening social apps."
    },
    {
      type: "positive",
      icon: "🌟",
      title: "Great Progress!",
      message: "You've reduced mindless scrolling by 34% this week. Your focus sessions are getting longer.",
      confidence: 92,
      action: "Keep building on this momentum with scheduled social media breaks."
    },
    {
      type: "suggestion",
      icon: "💡",
      title: "Suggestion",
      message: "Your peak distraction time seems to be 3-5 PM. Consider a short walk or meditation during this window.",
      confidence: 76,
      action: "Set a daily 3 PM reminder for a mindfulness break."
    }
  ];

  const reflectionPrompts = [
    "How did your digital habits make you feel today?",
    "What triggered your longest social media session?",
    "Did you accomplish what you intended to do online?",
    "What would you do differently tomorrow?",
    "How can technology better serve your goals?"
  ];

  const [currentPrompt] = useState(reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'pattern': return 'bg-blue-50 border-blue-200';
      case 'suggestion': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Coach Header */}
      <Card className="p-6 shadow-soft bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-purple-800">Your Digital Wellness Coach</h2>
            <p className="text-sm text-purple-600">Helping you build healthier digital habits</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-purple-700">Today's wellness score:</span>
          <Badge className="bg-purple-100 text-purple-800">7.2/10 - Good!</Badge>
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Today's Insights
        </h3>
        
        <div className="space-y-4">
          {aiInsights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{insight.icon}</span>
                  <span className="font-medium text-sm">{insight.title}</span>
                </div>
                <div className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                  {insight.confidence}% confident
                </div>
              </div>
              
              <p className="text-sm text-foreground mb-3">
                {insight.message}
              </p>
              
              <div className="bg-white/50 p-3 rounded border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Suggested Action</span>
                </div>
                <p className="text-xs text-foreground">
                  {insight.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reflection Prompt */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Daily Reflection
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="text-sm font-medium text-pink-800 mb-2">Today's Prompt:</p>
            <p className="text-foreground">{currentPrompt}</p>
          </div>
          
          <Textarea
            placeholder="Take a moment to reflect..."
            value={currentReflection}
            onChange={(e) => setCurrentReflection(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          <div className="flex gap-2">
            <Button size="sm">
              Save Reflection
            </Button>
            <Button size="sm" variant="outline">
              Get New Prompt
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium text-sm">🧘‍♀️ Take a Mindful Break</div>
              <div className="text-xs text-muted-foreground">2-minute breathing exercise</div>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium text-sm">📖 Journal Entry</div>
              <div className="text-xs text-muted-foreground">Process your thoughts</div>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium text-sm">🚶‍♀️ Suggested Activity</div>
              <div className="text-xs text-muted-foreground">Go for a short walk</div>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium text-sm">🎯 Set Daily Intention</div>
              <div className="text-xs text-muted-foreground">Plan your digital usage</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Gentle Reminders */}
      <Card className="p-4 shadow-soft bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">💙</span>
          <span className="font-medium text-blue-800">Remember</span>
        </div>
        <p className="text-sm text-blue-700">
          You're on a journey of digital wellness. Every small step matters, and there's no judgment here - just awareness and growth.
        </p>
      </Card>
    </div>
  );
};