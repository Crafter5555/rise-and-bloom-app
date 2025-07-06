import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Link } from "react-router-dom";
import { useRealStats } from "@/hooks/useRealStats";
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
  Zap,
  Loader2
} from "lucide-react";

const Stats = () => {
  const { stats, isLoading, error } = useRealStats();

  // Mock digital health stats (would be replaced with real data in production)
  const digitalHealthStats = {
    screenTime: { value: "4h 23m", change: "+12%", trend: "up" },
    pickups: { value: "47", change: "-8%", trend: "down" },
    focusScore: { value: stats?.overview.focusScore?.toString() || "7.2", change: "+0.5", trend: "up" },
    intentionalUsage: { value: "68%", change: "+15%", trend: "up" }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your statistics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to load statistics</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  // Quiz-based wellness data
  const quizData = {
    morningMetrics: {
      avgSleepQuality: 7.8,
      avgSleepHours: 7.2,
      avgMorningEnergy: 7.9,
      avgMorningMood: 8.1,
      quizCompletionRate: 85
    },
    eveningMetrics: {
      avgOverallMood: 7.4,
      avgEveningEnergy: 6.8,
      avgDaySuccess: 7.6,
      gratitudeEntries: 21,
      quizCompletionRate: 78
    },
    correlations: {
      sleepVsFocus: 0.73,
      energyVsTasks: 0.68,
      moodVsProductivity: 0.71,
      screenTimeVsMood: -0.45
    }
  };

  const topApps = [
    { name: "Instagram", time: "1h 23m", icon: "📸", change: "+45%" },
    { name: "YouTube", time: "1h 12m", icon: "▶️", change: "+22%" },
    { name: "TikTok", time: "54m", icon: "🎵", change: "-8%" },
    { name: "Twitter/X", time: "32m", icon: "🐦", change: "+45%" }
  ];

  // Enhanced mood tracking with quiz data
  const weeklyWellness = [
    { day: "Mon", morningMood: 8, eveningMood: 7, energy: 8, sleep: 7, emoji: "😊" },
    { day: "Tue", morningMood: 6, eveningMood: 6, energy: 6, sleep: 6, emoji: "😐" },
    { day: "Wed", morningMood: 9, eveningMood: 8, energy: 9, sleep: 8, emoji: "😄" },
    { day: "Thu", morningMood: 7, eveningMood: 7, energy: 7, sleep: 7, emoji: "🙂" },
    { day: "Fri", morningMood: 8, eveningMood: 8, energy: 8, sleep: 8, emoji: "😊" },
    { day: "Sat", morningMood: 9, eveningMood: 9, energy: 9, sleep: 9, emoji: "😄" },
    { day: "Sun", morningMood: 7, eveningMood: 7, energy: 7, sleep: 7, emoji: "🙂" }
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">
            <Activity className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">
            <Target className="w-4 h-4 mr-1" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="digital" className="text-xs">
            <Smartphone className="w-4 h-4 mr-1" />
            Digital
          </TabsTrigger>
          <TabsTrigger value="habits" className="text-xs">
            <Heart className="w-4 h-4 mr-1" />
            Habits
          </TabsTrigger>
          <TabsTrigger value="wellness" className="text-xs">
            <Brain className="w-4 h-4 mr-1" />
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
              value={stats.overview.currentStreak.toString()}
              subtitle="days"
              color="warning"
            />
            <MetricCard
              icon="🏆"
              title="Goals Hit"
              value={stats.goals.completed.toString()}
              subtitle="completed"
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
              value={`${stats.overview.habitSuccessRate}%`}
              subtitle="this week"
              color="accent"
            />
          </div>

          {/* Weekly Progress Ring */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">This Week's Progress</h3>
            <div className="flex items-center justify-center">
              <ProgressRing progress={stats.overview.weeklyCompletionRate} size="lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.overview.weeklyCompletionRate}%</div>
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

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Task Overview Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Today's Tasks</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Real Data</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{stats.today.completed}/{stats.today.total}</div>
                <div className="text-xs text-muted-foreground">{stats.today.completionRate}% complete</div>
            </Card>

            <Card className="p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Average</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600">Live</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-success">{stats.tasks.weeklyAverage}</div>
                <div className="text-xs text-muted-foreground">tasks per day</div>
            </Card>

            <Card className="p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Task Streak</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-warning">{stats.overview.currentStreak}</div>
                <div className="text-xs text-muted-foreground">consecutive days</div>
            </Card>

            <Card className="p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600">Overall</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-accent">{stats.tasks.completionRate}%</div>
                <div className="text-xs text-muted-foreground">all tasks</div>
            </Card>
          </div>

          {/* Task Categories Breakdown */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Task Categories This Week</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💼</span>
                    <div>
                      <div className="font-medium text-sm">Work Tasks</div>
                      <div className="text-xs text-muted-foreground">32 tasks • 89% complete</div>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">High Priority</Badge>
                </div>
                <Progress value={89} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏠</span>
                    <div>
                      <div className="font-medium text-sm">Personal</div>
                      <div className="text-xs text-muted-foreground">18 tasks • 67% complete</div>
                    </div>
                  </div>
                  <Badge variant="outline">Medium Priority</Badge>
                </div>
                <Progress value={67} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💪</span>
                    <div>
                      <div className="font-medium text-sm">Health & Fitness</div>
                      <div className="text-xs text-muted-foreground">12 tasks • 83% complete</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">On Track</Badge>
                </div>
                <Progress value={83} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📚</span>
                    <div>
                      <div className="font-medium text-sm">Learning</div>
                      <div className="text-xs text-muted-foreground">8 tasks • 50% complete</div>
                    </div>
                  </div>
                  <Badge variant="outline">Low Priority</Badge>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Productivity Patterns */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Peak Productivity Hours
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">9-11 AM</span>
                <div className="flex items-center gap-2">
                  <Progress value={95} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">2-4 PM</span>
                <div className="flex items-center gap-2">
                  <Progress value={78} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-9 PM</span>
                <div className="flex items-center gap-2">
                  <Progress value={62} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8">62%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">11 PM-12 AM</span>
                <div className="flex items-center gap-2">
                  <Progress value={23} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8">23%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Weekly Task Trends */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Weekly Completion Trends</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center">
                {stats.productivity.weeklyData.map((dayData, index) => {
                  const maxHeight = Math.max(...stats.productivity.weeklyData.map(d => d.completed), 1);
                  return (
                    <div key={dayData.day} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-muted-foreground">{dayData.day}</div>
                      <div className="w-6 bg-muted rounded-full h-16 flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-full"
                          style={{ height: `${dayData.completed === 0 ? 0 : Math.max((dayData.completed / maxHeight) * 100, 10)}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium">{dayData.completed}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Average: {stats.tasks.weeklyAverage} tasks completed per day</div>
              </div>
            </div>
          </Card>

          {/* Task Insights */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Task Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Productivity Peak</span>
                </div>
                <p className="text-sm text-green-700">
                  You complete 40% more tasks on Wednesday mornings. Consider scheduling important tasks during this time.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Early Bird Advantage</span>
                </div>
                <p className="text-sm text-blue-700">
                  Tasks completed before 11 AM have a 95% success rate vs 68% for afternoon tasks.
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Batch Processing</span>
                </div>
                <p className="text-sm text-orange-700">
                  Grouping similar tasks increases completion rate by 23%. Try batching work tasks together.
                </p>
              </div>
            </div>
          </Card>

          {/* Overdue & Upcoming */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 shadow-soft">
              <h3 className="text-lg font-semibold mb-3 text-red-700">⚠️ Overdue Tasks</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Review quarterly goals</div>
                  <div className="text-xs text-red-600">2 days overdue</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Schedule dentist appointment</div>
                  <div className="text-xs text-red-600">1 day overdue</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                2 of 47 total tasks overdue (4.3%)
              </div>
            </Card>

            <Card className="p-4 shadow-soft">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">📅 Upcoming</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Finish presentation draft</div>
                  <div className="text-xs text-blue-600">Due tomorrow</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Team standup preparation</div>
                  <div className="text-xs text-blue-600">Due in 2 days</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                8 tasks due this week
              </div>
            </Card>
          </div>
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
          {/* Quiz Completion Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌅</span>
                <span className="text-sm font-medium">Morning Planning</span>
              </div>
              <div className="text-2xl font-bold text-primary">{quizData.morningMetrics.quizCompletionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
              <Progress value={quizData.morningMetrics.quizCompletionRate} className="h-2 mt-2" />
            </Card>
            
            <Card className="p-4 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌙</span>
                <span className="text-sm font-medium">Evening Reflection</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{quizData.eveningMetrics.quizCompletionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
              <Progress value={quizData.eveningMetrics.quizCompletionRate} className="h-2 mt-2" />
            </Card>
          </div>

          {/* Wellness Metrics Dashboard */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Weekly Wellness Averages</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quizData.morningMetrics.avgSleepQuality}/10</div>
                <div className="text-sm text-blue-700">Sleep Quality</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{quizData.morningMetrics.avgSleepHours}h</div>
                <div className="text-sm text-green-700">Sleep Duration</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{quizData.morningMetrics.avgMorningEnergy}/10</div>
                <div className="text-sm text-orange-700">Morning Energy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{quizData.eveningMetrics.avgOverallMood}/10</div>
                <div className="text-sm text-purple-700">Overall Mood</div>
              </div>
            </div>
          </Card>

          {/* Enhanced Mood & Energy Tracking */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Daily Wellness Patterns</h3>
            <div className="space-y-4">
              {/* Morning vs Evening Mood */}
              <div>
                <div className="text-sm font-medium mb-2">Morning vs Evening Mood</div>
                <div className="flex justify-between items-end mb-2">
                  {weeklyWellness.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                      <div className="flex gap-1">
                        <div 
                          className="w-4 bg-gradient-to-t from-yellow-400 to-orange-400 rounded-sm"
                          style={{ height: `${day.morningMood * 4}px` }}
                          title={`Morning: ${day.morningMood}/10`}
                        />
                        <div 
                          className="w-4 bg-gradient-to-t from-purple-400 to-blue-400 rounded-sm"
                          style={{ height: `${day.eveningMood * 4}px` }}
                          title={`Evening: ${day.eveningMood}/10`}
                        />
                      </div>
                      <div className="text-lg">{day.emoji}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-t from-yellow-400 to-orange-400 rounded-sm" />
                    <span>Morning</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-t from-purple-400 to-blue-400 rounded-sm" />
                    <span>Evening</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Energy & Sleep Pattern */}
              <div>
                <div className="text-sm font-medium mb-2">Energy & Sleep Quality</div>
                <div className="flex justify-between items-end mb-2">
                  {weeklyWellness.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                      <div className="flex gap-1">
                        <div 
                          className="w-4 bg-gradient-to-t from-green-400 to-green-600 rounded-sm"
                          style={{ height: `${day.energy * 4}px` }}
                          title={`Energy: ${day.energy}/10`}
                        />
                        <div 
                          className="w-4 bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm"
                          style={{ height: `${day.sleep * 4}px` }}
                          title={`Sleep: ${day.sleep}/10`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-t from-green-400 to-green-600 rounded-sm" />
                    <span>Energy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm" />
                    <span>Sleep</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Health Correlations */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Health Insights & Correlations
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">💤</span>
                    <span className="font-medium text-green-800">Sleep → Focus</span>
                    <Badge className="bg-green-100 text-green-800">{(quizData.correlations.sleepVsFocus * 100).toFixed(0)}% correlation</Badge>
                  </div>
                  <p className="text-sm text-green-700">
                    Better sleep quality strongly predicts higher focus scores the next day.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">⚡</span>
                    <span className="font-medium text-blue-800">Energy → Tasks</span>
                    <Badge className="bg-blue-100 text-blue-800">{(quizData.correlations.energyVsTasks * 100).toFixed(0)}% correlation</Badge>
                  </div>
                  <p className="text-sm text-blue-700">
                    Higher morning energy levels lead to significantly more completed tasks.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600">😊</span>
                    <span className="font-medium text-purple-800">Mood → Productivity</span>
                    <Badge className="bg-purple-100 text-purple-800">{(quizData.correlations.moodVsProductivity * 100).toFixed(0)}% correlation</Badge>
                  </div>
                  <p className="text-sm text-purple-700">
                    Positive mood in the morning correlates with higher overall productivity.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-600">📱</span>
                    <span className="font-medium text-orange-800">Screen Time → Mood</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">-{Math.abs(quizData.correlations.screenTimeVsMood * 100).toFixed(0)}% correlation</Badge>
                  </div>
                  <p className="text-sm text-orange-700">
                    Excessive screen time negatively impacts evening mood and reflection quality.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Weekly Pattern</span>
                </div>
                <p className="text-sm text-purple-700">
                  Your best days happen when: sleep quality ≥8, morning energy ≥8, and screen time &lt;4 hours. 
                  This pattern occurred 3 times this week with 94% average task completion.
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