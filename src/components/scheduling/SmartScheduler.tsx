import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Brain, Calendar } from "lucide-react";

interface ScheduleSuggestion {
  id: string;
  activity: string;
  suggestedTime: string;
  reason: string;
  energyLevel: 'high' | 'medium' | 'low';
  confidence: number;
}

export const SmartScheduler = () => {
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [userEnergyPattern, setUserEnergyPattern] = useState<any[]>([]);

  useEffect(() => {
    // Mock AI-generated schedule suggestions based on user patterns
    const mockSuggestions: ScheduleSuggestion[] = [
      {
        id: '1',
        activity: 'Morning Exercise',
        suggestedTime: '7:00 AM',
        reason: 'Your energy peaks at this time. 89% completion rate historically.',
        energyLevel: 'high',
        confidence: 94
      },
      {
        id: '2',
        activity: 'Deep Work Session',
        suggestedTime: '9:30 AM',
        reason: 'Post-exercise cognitive boost window. Focus is highest.',
        energyLevel: 'high',
        confidence: 87
      },
      {
        id: '3',
        activity: 'Meditation',
        suggestedTime: '2:00 PM',
        reason: 'Your typical energy dip. Meditation helps with afternoon slump.',
        energyLevel: 'low',
        confidence: 78
      },
      {
        id: '4',
        activity: 'Creative Work',
        suggestedTime: '4:00 PM',
        reason: 'Your creativity scores peak in late afternoon based on mood data.',
        energyLevel: 'medium',
        confidence: 82
      }
    ];

    setSuggestions(mockSuggestions);
  }, []);

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'high': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'medium': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'low': return <Zap className="w-4 h-4 text-blue-500" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const handleAcceptSuggestion = (suggestion: ScheduleSuggestion) => {
    // In real implementation, this would save to daily_plans
    console.log('Accepting suggestion:', suggestion);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-Powered Schedule Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{suggestion.suggestedTime}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.activity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEnergyIcon(suggestion.energyLevel)}
                    <span className="text-xs text-muted-foreground">
                      {suggestion.confidence}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {suggestion.reason}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptSuggestion(suggestion)}
                  >
                    Accept
                  </Button>
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};