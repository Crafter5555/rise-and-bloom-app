import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, Trophy, ChevronRight } from "lucide-react";

interface HabitGuide {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  progress: number;
  steps: number;
  icon: string;
}

export const HabitGuides = () => {
  const [guides] = useState<HabitGuide[]>([
    {
      id: '1',
      title: 'Morning Routine Mastery',
      description: 'Build a powerful morning routine that sets you up for success every day',
      duration: '21 days',
      difficulty: 'Beginner',
      category: 'Productivity',
      progress: 65,
      steps: 7,
      icon: '🌅'
    },
    {
      id: '2',
      title: 'Meditation for Beginners',
      description: 'Learn the fundamentals of mindfulness and daily meditation practice',
      duration: '14 days',
      difficulty: 'Beginner',
      category: 'Wellness',
      progress: 30,
      steps: 5,
      icon: '🧘‍♀️'
    },
    {
      id: '3',
      title: 'Exercise Habit Formation',
      description: 'Create a sustainable fitness routine that sticks for life',
      duration: '30 days',
      difficulty: 'Intermediate',
      category: 'Health',
      progress: 80,
      steps: 10,
      icon: '💪'
    },
    {
      id: '4',
      title: 'Digital Minimalism',
      description: 'Reduce screen time and develop healthier technology habits',
      duration: '28 days',
      difficulty: 'Advanced',
      category: 'Digital Wellness',
      progress: 15,
      steps: 8,
      icon: '📱'
    }
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Productivity': return 'text-blue-600';
      case 'Wellness': return 'text-purple-600';
      case 'Health': return 'text-green-600';
      case 'Digital Wellness': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Expert Habit Guides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {guides.map((guide) => (
              <div key={guide.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{guide.icon}</div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {guide.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{guide.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>{guide.steps} steps</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getDifficultyColor(guide.difficulty)}>
                        {guide.difficulty}
                      </Badge>
                      <Badge variant="outline" className={getCategoryColor(guide.category)}>
                        {guide.category}
                      </Badge>
                    </div>
                    
                    {guide.progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{guide.progress}%</span>
                        </div>
                        <Progress value={guide.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Insight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Today's Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-2">The 2-Minute Rule</h4>
            <p className="text-sm text-muted-foreground">
              When starting a new habit, make it so easy you can't say no. Want to start exercising? 
              Begin with just 2 minutes of movement. The goal is to establish the identity first, 
              then improve the habit later.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};