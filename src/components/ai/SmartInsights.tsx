import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertTriangle, Trophy, Filter, Loader2, Brain } from 'lucide-react';
import { useRealInsights } from '@/hooks/useRealInsights';

export const SmartInsights = () => {
  const { insights, isLoading, generateInsights, isGenerating } = useRealInsights();
  const [filter, setFilter] = useState<'all' | 'actionable'>('all');

  // Auto-generate insights on component mount if none exist
  useEffect(() => {
    if (!isLoading && insights.length === 0) {
      generateInsights();
    }
  }, [isLoading, insights.length, generateInsights]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-blue-100 text-blue-800';
      case 'recommendation': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'celebration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'warning': return AlertTriangle;
      case 'celebration': return Trophy;
      default: return Brain;
    }
  };

  const filteredInsights = insights.filter(insight => 
    filter === 'all' || insight.actionable
  );

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
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateInsights()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4 mr-1" />
              )}
              Generate
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'actionable' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('actionable')}
            >
              <Filter className="w-4 h-4 mr-1" />
              Actionable
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No insights available. Click "Generate" to analyze your data.
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const IconComponent = getTypeIcon(insight.insight_type);
            return (
              <div 
                key={insight.id}
                className={`border rounded-lg p-4 space-y-3 ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getTypeColor(insight.insight_type)}>
                      {insight.insight_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(insight.confidence * 100)}% confidence
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
            );
          })
        )}
      </CardContent>
    </Card>
  );
};