import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Brain, Zap, Coffee, Moon, Sun, CheckCircle, Calendar } from "lucide-react";

interface ScheduleSuggestion {
  id: string;
  activity: string;
  time: string;
  reason: string;
  energyLevel: 'high' | 'medium' | 'low';
  confidence: number;
  category: 'work' | 'exercise' | 'mindfulness' | 'learning' | 'social';
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

export const SmartScheduler = () => {
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Generate smart schedule suggestions based on user patterns
    setSuggestions([
      {
        id: '1',
        activity: 'Deep Work Session',
        time: '9:00 AM - 11:00 AM',
        reason: 'Your productivity peaks during this time with 92% focus rate',
        energyLevel: 'high',
        confidence: 95,
        category: 'work',
        duration: '2 hours',
        priority: 'high'
      },
      {
        id: '2',
        activity: 'Morning Workout',
        time: '7:00 AM - 8:00 AM',
        reason: 'Exercise now boosts your energy by 35% for the rest of the day',
        energyLevel: 'high',
        confidence: 87,
        category: 'exercise',
        duration: '1 hour',
        priority: 'high'
      },
      {
        id: '3',
        activity: 'Meditation Break',
        time: '2:00 PM - 2:15 PM',
        reason: 'Perfect time to recharge during your natural energy dip',
        energyLevel: 'low',
        confidence: 83,
        category: 'mindfulness',
        duration: '15 minutes',
        priority: 'medium'
      },
      {
        id: '4',
        activity: 'Learning Session',
        time: '7:30 PM - 8:30 PM',
        reason: 'Your retention rate is 40% higher in the evening',
        energyLevel: 'medium',
        confidence: 78,
        category: 'learning',
        duration: '1 hour',
        priority: 'medium'
      },
      {
        id: '5',
        activity: 'Social Connection',
        time: '6:00 PM - 7:00 PM',
        reason: 'Wind down time when you enjoy meaningful conversations',
        energyLevel: 'medium',
        confidence: 72,
        category: 'social',
        duration: '1 hour',
        priority: 'low'
      }
    ]);
  }, []);

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'high': return <Zap className="h-4 w-4 text-green-500" />;
      case 'medium': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Moon className="h-4 w-4 text-blue-500" />;
      default: return <Coffee className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return '💼';
      case 'exercise': return '💪';
      case 'mindfulness': return '🧘';
      case 'learning': return '📚';
      case 'social': return '👥';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    setAcceptedSuggestions(prev => [...prev, suggestionId]);
    // Here you would integrate with calendar/scheduling system
  };

  const handleReschedule = (suggestionId: string) => {
    // Open scheduling modal or interface
    console.log('Reschedule suggestion:', suggestionId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Schedule Optimizer
        </CardTitle>
        <CardDescription>
          Personalized schedule suggestions based on your energy patterns and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className={`border rounded-lg p-4 space-y-3 transition-all ${
              acceptedSuggestions.includes(suggestion.id) 
                ? 'bg-green-50 border-green-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {suggestion.activity}
                    {acceptedSuggestions.includes(suggestion.id) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{suggestion.time}</span>
                    <span>•</span>
                    <span>{suggestion.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getPriorityColor(suggestion.priority)}>
                  {suggestion.priority} priority
                </Badge>
                <div className="flex items-center gap-1">
                  {getEnergyIcon(suggestion.energyLevel)}
                  <span className="text-xs text-muted-foreground">
                    {suggestion.confidence}% confidence
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground pl-11">{suggestion.reason}</p>
            
            {!acceptedSuggestions.includes(suggestion.id) ? (
              <div className="flex gap-2 pl-11">
                <Button 
                  size="sm" 
                  onClick={() => handleAcceptSuggestion(suggestion.id)}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  Accept & Schedule
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReschedule(suggestion.id)}
                >
                  Reschedule
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            ) : (
              <div className="pl-11">
                <Badge variant="secondary" className="text-green-700">
                  ✓ Added to Schedule
                </Badge>
              </div>
            )}
          </div>
        ))}
        
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Based on 30 days of behavior analysis
            </div>
            <Button variant="outline" size="sm">
              Customize Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};