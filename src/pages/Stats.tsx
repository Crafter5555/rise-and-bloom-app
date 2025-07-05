import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Smartphone, 
  Brain, 
  Eye,
  Settings,
  ExternalLink,
  Activity,
  Heart,
  Zap
} from "lucide-react";

const Stats = () => {
  // Mock comprehensive stats data
  const digitalHealthStats = {
    screenTime: { value: "4h 23m", change: "+12%", trend: "up" },
    pickups: { value: "47", change: "-8%", trend: "down" },
    focusScore: { value: "7.2", change: "+0.5", trend: "up" },
    intentionalUsage: { value: "68%", change: "+15%", trend: "up" }
  };

  const topApps = [
    { name: "Instagram", time: "1h 23m", icon: "📸", change: "+45%" },
    { name: "YouTube", time: "1h 12m", icon: "▶️", change: "+22%" },
    { name: "TikTok", time: "54m", icon: "🎵", change: "-8%" },
    { name: "Twitter/X", time: "32m", icon: "🐦", change: "+45%" }
  ];

  const weeklyMood = [
    { day: "Mon", score: 8, emoji: "😊" },
    { day: "Tue", score: 6, emoji: "😐" },
    { day: "Wed", score: 9, emoji: "😄" },
    { day: "Thu", score: 7, emoji: "🙂" },
    { day: "Fri", score: 8, emoji: "😊" },
    { day: "Sat", score: 9, emoji: "😄" },
    { day: "Sun", score: 7, emoji: "🙂" }
  ];

  const habits = [
    { name: "Morning Planning", completion: 85, icon: "☀️", streak: 12 },
    { name: "Evening Reflection", completion: 72, icon: "🌙", streak: 8 },
    { name: "Exercise", completion: 64, icon: "💪", streak: 5 },
    { name: "Meditation", completion: 43, icon: "🧘", streak: 3 },
    { name: "Journaling", completion: 78, icon: "📝", streak: 7 }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Statistics</h1>
          <p className="text-base text-muted-foreground">Your comprehensive wellness insights</p>
        </div>
        <Link to="/digital-wellbeing">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Digital Wellbeing
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">
            <Activity className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="digital" className="text-xs">
            <Smartphone className="w-4 h-4 mr-1" />
            Digital
          </TabsTrigger>
          <TabsTrigger value="habits" className="text-xs">
            <Target className="w-4 h-4 mr-1" />
            Habits
          </TabsTrigger>
          <TabsTrigger value="wellness" className="text-xs">
            <Heart className="w-4 h-4 mr-1" />
            Wellness
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              icon="🔥"
              title="Current Streak"
              value="12"
              subtitle="days"
              color="warning"
            />
            <MetricCard
              icon="🏆"
              title="Goals Hit"
              value="23"
              subtitle="this month"
              color="success"
            />
            <MetricCard
              icon="📱"
              title="Focus Score"
              value={digitalHealthStats.focusScore.value}
              subtitle="/10"
              color="primary"
            />
            <MetricCard
              icon="🎯"
              title="Habit Success"
              value="71%"
              subtitle="this week"
              color="accent"
            />
          </div>

          {/* Weekly Progress Ring */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">This Week's Progress</h3>
            <div className="flex items-center justify-center">
              <ProgressRing progress={71} size="lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">71%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </ProgressRing>
            </div>
          </Card>

          {/* Quick Insights */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Week Highlights</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600">🎉</span>
                <div>
                  <div className="text-sm font-medium text-green-800">Best Focus Day</div>
                  <div className="text-xs text-green-600">Wednesday - 8.9/10 focus score</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600">📱</span>
                <div>
                  <div className="text-sm font-medium text-blue-800">Digital Wellness</div>
                  <div className="text-xs text-blue-600">15% more intentional usage vs last week</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-600">🧘</span>
                <div>
                  <div className="text-sm font-medium text-purple-800">Mindfulness Streak</div>
                  <div className="text-xs text-purple-600">8 days of evening reflection</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Digital Health Tab */}
        <TabsContent value="digital" className="space-y-6">
          {/* Digital Health Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Screen Time</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(digitalHealthStats.screenTime.trend)}
                  <span className={`text-xs ${getTrendColor(digitalHealthStats.screenTime.trend)}`}>
                    {digitalHealthStats.screenTime.change}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">{digitalHealthStats.screenTime.value}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </Card>

            <Card className="p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Phone Pickups</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(digitalHealthStats.pickups.trend)}
                  <span className={`text-xs ${getTrendColor(digitalHealthStats.pickups.trend)}`}>
                    {digitalHealthStats.pickups.change}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-warning">{digitalHealthStats.pickups.value}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </Card>

            <Card className="p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Focus Score</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(digitalHealthStats.focusScore.trend)}
                  <span className={`text-xs ${getTrendColor(digitalHealthStats.focusScore.trend)}`}>
                    {digitalHealthStats.focusScore.change}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-success">{digitalHealthStats.focusScore.value}</div>
              <div className="text-xs text-muted-foreground">/10</div>
            </Card>

            <Card className="p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Intentional Use</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(digitalHealthStats.intentionalUsage.trend)}
                  <span className={`text-xs ${getTrendColor(digitalHealthStats.intentionalUsage.trend)}`}>
                    {digitalHealthStats.intentionalUsage.change}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-accent">{digitalHealthStats.intentionalUsage.value}</div>
              <div className="text-xs text-muted-foreground">This week</div>
            </Card>
          </div>

          {/* Top Apps */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Top Apps This Week</h3>
            <div className="space-y-4">
              {topApps.map((app, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{app.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{app.name}</div>
                      <div className="text-xs text-muted-foreground">{app.time}</div>
                    </div>
                  </div>
                  <Badge variant={app.change.startsWith('+') ? 'destructive' : 'outline'}>
                    {app.change}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Attention Patterns */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Attention Patterns
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-purple-600">4m 32s</div>
                <div className="text-xs text-muted-foreground">Avg Attention</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">2h 18m</div>
                <div className="text-xs text-muted-foreground">Deep Work</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">23</div>
                <div className="text-xs text-muted-foreground">Interruptions</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-6">
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Habit Tracking</h3>
            <div className="space-y-4">
              {habits.map((habit, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{habit.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{habit.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {habit.streak} day streak
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{habit.completion}%</div>
                      <div className="text-xs text-muted-foreground">this week</div>
                    </div>
                  </div>
                  <Progress value={habit.completion} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Wellness Tab */}
        <TabsContent value="wellness" className="space-y-6">
          {/* Mood Tracking */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Weekly Mood</h3>
            <div className="flex justify-between items-end mb-4">
              {weeklyMood.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="text-2xl">{day.emoji}</div>
                  <div className="w-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-t from-purple-400 to-pink-400 rounded-full transition-all"
                      style={{ height: `${day.score * 10}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{day.day}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">7.7/10</div>
              <div className="text-sm text-muted-foreground">Average mood this week</div>
            </div>
          </Card>

          {/* Wellness Insights */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Wellness Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Energy Boost</span>
                </div>
                <p className="text-sm text-green-700">
                  Your energy levels are highest on days when you complete morning planning. 
                  Keep building this habit!
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Focus Pattern</span>
                </div>
                <p className="text-sm text-blue-700">
                  Your focus is 34% better on days with lower social media usage. 
                  Consider app time limits during work hours.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stats;