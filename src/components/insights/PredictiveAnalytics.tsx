import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Brain, Target, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRealPredictiveAnalytics } from "@/hooks/useRealPredictiveAnalytics";

export const PredictiveAnalytics = () => {
  const { predictions, patterns, isLoading, runAnalysis, isAnalyzing } = useRealPredictiveAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const displayPredictions = predictions.length > 0 ? predictions : [];
  const displayPatterns = patterns.length > 0 ? patterns : [];

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

  return (
    <div className="space-y-4">
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
              onClick={() => runAnalysis()}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Patterns...
                </>
              ) : (
                'Run Advanced Analysis'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {displayPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Upcoming Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayPredictions.map((prediction) => (
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
                        Suggested Action
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
      )}

      {displayPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              Behavioral Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayPatterns.map((pattern, index) => (
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
      )}

      {displayPredictions.length === 0 && displayPatterns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No predictions available yet. Complete more activities to generate personalized insights.
            </p>
            <Button onClick={() => runAnalysis()} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Generate Predictions'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
