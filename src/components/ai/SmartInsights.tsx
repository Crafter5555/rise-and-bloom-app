import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Brain, Zap, Target, AlertCircle, CheckCircle } from "lucide-react";

interface SmartInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'warning' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  category: 'productivity' | 'wellness' | 'habits' | 'goals';
  icon: any;
  priority: 'low' | 'medium' | 'high';
}

export const SmartInsights = () => {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [filter, setFilter] = useState<'all' | 'actionable'>('all');

  useEffect(() => {
    // Generate smart insights based on user data patterns
    setInsights([
      {
        id: '1',
        type: 'pattern',
        title: 'Peak Performance Window Identified',
        description: 'Your productivity peaks between 9-11 AM with 85% task completion rate. Consider scheduling important work during this time.',
        confidence: 92,
        actionable: true,
        category: 'productivity',
        icon: TrendingUp,
        priority: 'high'
      },
      {
        id: '2',
        type: 'recommendation',
        title: 'Sleep-Mood Correlation',
        description: 'Getting 7.5+ hours of sleep correlates with 40% higher mood ratings. Your optimal bedtime appears to be 10:30 PM.',
        confidence: 87,
        actionable: true,
        category: 'wellness',
        icon: Brain,
        priority: 'high'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Habit Streak at Risk',
        description: 'Your meditation streak of 12 days might be broken. You typically struggle on Fridays - consider setting a reminder.',
        confidence: 78,
        actionable: true,
        category: 'habits',
        icon: AlertCircle,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'celebration',
        title: 'Consistency Achievement',
        description: 'You\'ve maintained 90%+ goal completion for 3 weeks straight - your best performance yet!',
        confidence: 100,
        actionable: false,
        category: 'goals',
        icon: CheckCircle,
        priority: 'low'
      },
      {
        id: '5',
        type: 'pattern',
        title: 'Exercise Energy Boost',
        description: 'Morning workouts increase your energy levels by 35% throughout the day compared to evening sessions.',
        confidence: 83,
        actionable: true,
        category: 'wellness',
        icon: Zap,
        priority: 'medium'
      }
    ]);
  }, []);

  const getTypeColor = (type: SmartInsight['type']) => {
    switch (type) {
      case 'pattern': return 'bg-blue-100 text-blue-800';
      case 'recommendation': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'celebration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SmartInsight['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200';
    }
  };

  const filteredInsights = filter === 'actionable' 
    ? insights.filter(insight => insight.actionable)
    : insights;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Insights
        </CardTitle>
        <CardDescription>
          AI-powered insights based on your behavior patterns and data
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Insights
          </Button>
          <Button 
            variant={filter === 'actionable' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('actionable')}
          >
            Actionable Only
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredInsights.map((insight) => (
          <div 
            key={insight.id}
            className={`border rounded-lg p-4 space-y-3 ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <insight.icon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getTypeColor(insight.type)}>
                  {insight.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {insight.confidence}% confidence
                </span>
              </div>
            </div>
            
            {insight.actionable && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Apply Suggestion
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};