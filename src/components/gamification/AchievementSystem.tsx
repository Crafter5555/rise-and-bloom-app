import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Calendar, Star, Loader2 } from 'lucide-react';
import { useRealAchievements } from '@/hooks/useRealAchievements';

export const AchievementSystem = () => {
  const { achievements, userProgress, isLoading } = useRealAchievements();
  
  const xpToNextLevel = (userProgress.level * 100) - userProgress.totalXp;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return Target;
      case 'habits': return Calendar;
      case 'goals': return Trophy;
      case 'streak': return Zap;
      default: return Star;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement System
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievement System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Level and XP */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Level {userProgress.level}</span>
            <span className="text-sm text-muted-foreground">
              {userProgress.totalXp} / {userProgress.level * 100} XP
            </span>
          </div>
          <Progress value={(userProgress.totalXp % 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {xpToNextLevel} XP to next level
          </p>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h4 className="font-medium">Achievements</h4>
          <div className="grid gap-3">
            {achievements.map((achievement) => {
              const IconComponent = getCategoryIcon(achievement.category);
              return (
                <Card 
                  key={achievement.id} 
                  className={`p-4 ${achievement.unlocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{achievement.title}</h5>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1"
                        />
                      </div>
                    </div>
                    
                    {achievement.unlocked && (
                      <div className="text-right">
                        <div className="text-yellow-600 font-medium">Unlocked!</div>
                        <div className="text-xs text-muted-foreground">+{achievement.xpReward} XP</div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};