import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Brain, Target, AlertCircle, CheckCircle } from "lucide-react";

interface Prediction {
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

interface PatternInsight {
  pattern: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;
  description: string;
}

export const PredictiveAnalytics = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Mock predictive analytics data
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        type: 'habit_completion',
        title: 'Morning Exercise Risk',
        description: 'Based on your recent patterns, there\'s a high chance you might skip morning exercise tomorrow',
        probability: 78,
        timeframe: 'Tomorrow 7:00 AM',
        confidence: 85,
        actionable: true,
        suggestion: 'Set your workout clothes out tonight and go to bed 30 minutes earlier'
      },
      {
        id: '2',
        type: 'energy_dip',
        title: 'Afternoon Energy Drop',
        description: 'You typically experience low energy around 2-3 PM based on your mood tracking',
        probability: 92,
        timeframe: 'Today 2:30 PM',
        confidence: 94,
        actionable: true,
        suggestion: 'Schedule a 5-minute walking break or meditation session'
      },
      {
        id: '3',
        type: 'goal_achievement',
        title: 'Weekly Reading Goal',
        description: 'You\'re on track to exceed your weekly reading goal by 23%',
        probability: 89,
        timeframe: 'End of week',
        confidence: 91,
        actionable: false
      },
      {
        id: '4',
        type: 'streak_break',
        title: 'Meditation Streak Risk',
        description: 'Weekend patterns suggest potential meditation streak interruption',
        probability: 65,
        timeframe: 'This weekend',
        confidence: 72,
        actionable: true,
        suggestion: 'Set a reminder for Saturday morning and prepare a backup 3-minute session'
      }
    ];

    const mockPatterns: PatternInsight[] = [
      {
        pattern: 'Monday Motivation',
        impact: 'positive',
        strength: 87,
        description: 'You consistently perform 34% better on habit completion on Mondays'
      },
      {
        pattern: 'Social Media Correlation',
        impact: 'negative',
        strength: 73,
        description: 'High social media usage (>2hrs) correlates with 45% lower productivity'
      },
      {
        pattern: 'Sleep Quality Impact',
        impact: 'positive',
        strength: 91,
        description: 'Quality sleep (>7hrs) increases next-day habit completion by 56%'
      },
      {
        pattern: 'Weekend Routine Gap',
        impact: 'negative',
        strength: 68,
        description: 'Weekend structure decreases by 40%, affecting Monday performance'
      }
    ];

    setPredictions(mockPredictions);
    setPatterns(mockPatterns);
  }, []);

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'habit_completion': return <Target className="w-4 h-4" />;
      case 'goal_achievement': return <CheckCircle className="w-4 h-4" />;
      case 'streak_break': return <AlertCircle className="w-4 h-4" />;
      case 'energy_dip': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case 'habit_completion': return 'text-blue-600';
      case 'goal_achievement': return 'text-green-600';
      case 'streak_break': return 'text-red-600';
      case 'energy_dip': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPatternColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update predictions with new "insights"
    setPredictions(prev => prev.map(pred => ({
      ...pred,
      probability: Math.max(0, Math.min(100, pred.probability + (Math.random() - 0.5) * 20))
    })));
    
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4">
      {/* Analysis Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Advanced AI analyzes your patterns to predict future behavior and optimize your success
            </p>
            <Button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing Patterns...' : 'Run Advanced Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Upcoming Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={getPredictionColor(prediction.type)}>
                      {getPredictionIcon(prediction.type)}
                    </div>
                    <h3 className="font-medium text-sm">{prediction.title}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {prediction.timeframe}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {prediction.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Probability</span>
                    <span className="font-medium">{prediction.probability}%</span>
                  </div>
                  <Progress value={prediction.probability} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confidence: {prediction.confidence}%</span>
                  </div>
                </div>
                
                {prediction.suggestion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-xs text-blue-800 mb-1">
                      💡 Suggested Action
                    </h4>
                    <p className="text-xs text-blue-700">
                      {prediction.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            Behavioral Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{pattern.pattern}</h3>
                  <Badge 
                    variant={pattern.impact === 'positive' ? 'default' : 
                            pattern.impact === 'negative' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {pattern.impact}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {pattern.description}
                </p>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Pattern Strength</span>
                    <span className="font-medium">{pattern.strength}%</span>
                  </div>
                  <Progress value={pattern.strength} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};