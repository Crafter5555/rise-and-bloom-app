
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Flame, Target, Calendar, Clock } from "lucide-react";

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
  const [userLevel, setUserLevel] = useState(5);
  const [userXP, setUserXP] = useState(1250);
  const [xpToNextLevel, setXpToNextLevel] = useState(1500);

  useEffect(() => {
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete your first habit',
        icon: Target,
        category: 'habits',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        xpReward: 50,
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Week Warrior',
        description: 'Maintain a 7-day habit streak',
        icon: Flame,
        category: 'streaks',
        progress: 7,
        maxProgress: 7,
        unlocked: true,
        xpReward: 150,
        rarity: 'rare'
      },
      {
        id: '3',
        title: 'Perfect Week',
        description: 'Complete all habits for 7 days straight',
        icon: Star,
        category: 'consistency',
        progress: 5,
        maxProgress: 7,
        unlocked: false,
        xpReward: 300,
        rarity: 'epic'
      },
      {
        id: '4',
        title: 'Early Bird',
        description: 'Complete morning routine before 7 AM for 5 days',
        icon: Clock,
        category: 'time',
        progress: 3,
        maxProgress: 5,
        unlocked: false,
        xpReward: 100,
        rarity: 'rare'
      },
      {
        id: '5',
        title: 'Goal Crusher',
        description: 'Complete 3 major goals',
        icon: Trophy,
        category: 'goals',
        progress: 1,
        maxProgress: 3,
        unlocked: false,
        xpReward: 500,
        rarity: 'legendary'
      }
    ];

    setAchievements(mockAchievements);
  }, []);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-300',
      rare: 'bg-blue-100 text-blue-800 border-blue-300',
      epic: 'bg-purple-100 text-purple-800 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[rarity];
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    const icons = {
      habits: Target,
      streaks: Flame,
      goals: Trophy,
      consistency: Star,
      time: Clock
    };
    return icons[category];
  };

  const progressPercentage = (userXP / xpToNextLevel) * 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Achievements & Progress
          </span>
          <div className="text-right">
            <div className="text-sm font-medium">Level {userLevel}</div>
            <div className="text-xs text-muted-foreground">{userXP} / {xpToNextLevel} XP</div>
          </div>
        </CardTitle>
        <Progress value={progressPercentage} className="w-full" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {achievements.map((achievement) => {
            const IconComponent = achievement.icon;
            const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
            
            return (
              <div 
                key={achievement.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  achievement.unlocked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked ? 'bg-green-100' : 'bg-muted'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      achievement.unlocked ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium text-sm ${
                        achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {achievement.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRarityColor(achievement.rarity)}`}
                        >
                          {achievement.rarity}
                        </Badge>
                        <span className="text-xs font-medium text-yellow-600">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={progressPercent} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
