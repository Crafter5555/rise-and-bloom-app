import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Zap, Calendar, Clock, Star } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'habits' | 'streaks' | 'goals' | 'consistency' | 'time';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const AchievementSystem = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState(12);
  const [userXP, setUserXP] = useState(2850);
  const [xpToNextLevel, setXpToNextLevel] = useState(150);

  useEffect(() => {
    // Mock achievement data
    setAchievements([
      {
        id: '1',
        title: 'Early Bird',
        description: 'Complete 7 morning routines in a row',
        icon: Calendar,
        category: 'habits',
        progress: 7,
        maxProgress: 7,
        unlocked: true,
        xpReward: 100,
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Streak Master',
        description: 'Maintain a 30-day habit streak',
        icon: Zap,
        category: 'streaks',
        progress: 24,
        maxProgress: 30,
        unlocked: false,
        xpReward: 500,
        rarity: 'epic'
      },
      {
        id: '3',
        title: 'Goal Crusher',
        description: 'Complete 5 goals in a month',
        icon: Target,
        category: 'goals',
        progress: 3,
        maxProgress: 5,
        unlocked: false,
        xpReward: 250,
        rarity: 'rare'
      },
      {
        id: '4',
        title: 'Time Master',
        description: 'Log 100 hours of focused work',
        icon: Clock,
        category: 'time',
        progress: 87,
        maxProgress: 100,
        unlocked: false,
        xpReward: 300,
        rarity: 'rare'
      },
      {
        id: '5',
        title: 'Consistency Legend',
        description: 'Complete daily check-ins for 100 days',
        icon: Star,
        category: 'consistency',
        progress: 45,
        maxProgress: 100,
        unlocked: false,
        xpReward: 1000,
        rarity: 'legendary'
      }
    ]);
  }, []);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'habits': return Calendar;
      case 'streaks': return Zap;
      case 'goals': return Target;
      case 'consistency': return Star;
      case 'time': return Clock;
      default: return Trophy;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievement System
        </CardTitle>
        <CardDescription>
          Track your progress and unlock achievements as you grow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Level {userLevel}</span>
            <span className="text-sm text-muted-foreground">{userXP} XP</span>
          </div>
          <Progress value={(xpToNextLevel - (xpToNextLevel - userXP % 100)) / xpToNextLevel * 100} />
          <p className="text-sm text-muted-foreground">{xpToNextLevel} XP to next level</p>
        </div>

        {/* Achievements Grid */}
        <div className="space-y-3">
          <h4 className="font-semibold">Your Achievements</h4>
          <div className="grid gap-3">
            {achievements.map((achievement) => {
              const CategoryIcon = getCategoryIcon(achievement.category);
              const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
              
              return (
                <div 
                  key={achievement.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    achievement.unlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <CategoryIcon className={`h-4 w-4 ${achievement.unlocked ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h5 className="font-medium">{achievement.title}</h5>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <Progress value={progressPercentage} />
                    {achievement.unlocked && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Trophy className="h-3 w-3" />
                        <span>+{achievement.xpReward} XP earned</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};