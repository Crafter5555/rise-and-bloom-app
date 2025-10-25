import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Smartphone, Eye, AlertTriangle, Loader2 } from "lucide-react";
import { useRealBehaviorInsights } from "@/hooks/useRealBehaviorInsights";

export const BehaviorInsights = () => {
  const { weeklyTrends, attentionData, distractionPatterns, sessionTriggers, isLoading } = useRealBehaviorInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const mockWeeklyTrends = [
    {
      app: "Instagram",
      icon: "📸",
      change: "+45%",
      direction: "up",
      hours: "9.2h",
      sessions: 67,
      avgSession: "8m 14s",
      insight: "Mostly night scrolling",
      attention: "low"
    },
    {
      app: "YouTube", 
      icon: "▶️",
      change: "-12%",
      direction: "down",
      hours: "5.8h",
      sessions: 23,
      avgSession: "15m 9s",
      insight: "Educational content increased",
      attention: "medium"
    },
    {
      app: "TikTok",
      icon: "🎵", 
      change: "+78%",
      direction: "up",
      hours: "6.4h",
      sessions: 89,
      avgSession: "4m 18s",
      insight: "Quick frequent sessions",
      attention: "low"
    },
    {
      app: "LinkedIn",
      icon: "💼",
      change: "-8%",
      direction: "down", 
      hours: "1.2h",
      sessions: 12,
      avgSession: "6m 12s",
      insight: "Morning check-ins",
      attention: "high"
    }
  ];

  const displayTrends = weeklyTrends.length > 0 ? weeklyTrends : mockWeeklyTrends;
  const displayPatterns = distractionPatterns.length > 0 ? distractionPatterns : [
    { time: "9-11 AM", intensity: 40, label: "Light browsing" },
    { time: "1-3 PM", intensity: 85, label: "Heavy scrolling" },
    { time: "7-10 PM", intensity: 95, label: "Peak usage" },
    { time: "10 PM+", intensity: 60, label: "Wind-down browsing" }
  ];
  const displayTriggers = sessionTriggers.length > 0 ? sessionTriggers : [
    { trigger: "Boredom/Habit", percentage: 43, color: "bg-red-500" },
    { trigger: "Notification", percentage: 28, color: "bg-orange-500" },
    { trigger: "Specific Purpose", percentage: 19, color: "bg-green-500" },
    { trigger: "Social Check", percentage: 10, color: "bg-purple-500" }
  ];

  const patterns = [
    {
      title: "Peak Distraction Windows",
      icon: <Clock className="w-5 h-5 text-orange-500" />,
      data: displayPatterns
    },
    {
      title: "Session Triggers",
      icon: <Smartphone className="w-5 h-5 text-blue-500" />,
      data: displayTriggers
    }
  ];

  const getTrendIcon = (direction: string) => {
    return direction === 'up' ? 
      <TrendingUp className="w-4 h-4 text-red-500" /> : 
      <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const getAttentionColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">This Week's Behavior Trends</h3>
        
        <div className="space-y-4">
          {displayTrends.map((trend, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{trend.icon}</span>
                  <div>
                    <div className="font-medium">{trend.app}</div>
                    <div className="text-sm text-muted-foreground">{trend.insight}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {getTrendIcon(trend.direction)}
                    <span className={`text-sm font-medium ${
                      trend.direction === 'up' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {trend.change}
                    </span>
                  </div>
                  <Badge className={getAttentionColor(trend.attention)}>
                    {trend.attention} attention
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">{trend.hours}</div>
                  <div className="text-xs text-muted-foreground">Total Time</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{trend.sessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{trend.avgSession}</div>
                  <div className="text-xs text-muted-foreground">Avg Session</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Attention & Focus Metrics */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-500" />
          Attention & Focus Analysis
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">{attentionData.focusScore}/10</div>
            <div className="text-sm text-purple-700">Focus Score</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{attentionData.attentionSpan}</div>
            <div className="text-sm text-blue-700">Avg Attention Span</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">{attentionData.deepWork}</div>
            <div className="text-sm text-green-700">Deep Work Time</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">{attentionData.interruptions}</div>
            <div className="text-sm text-orange-700">Daily Interruptions</div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Attention Insight</span>
          </div>
          <p className="text-sm text-yellow-700">
            Your multitasking score is {attentionData.multitasking}% - high multitasking often reduces focus quality. 
            Consider blocking time for single-task focused work.
          </p>
        </div>
      </Card>

      {/* Behavior Patterns */}
      {patterns.map((pattern, index) => (
        <Card key={index} className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {pattern.icon}
            {pattern.title}
          </h3>
          
          {pattern.title === "Peak Distraction Windows" ? (
            <div className="space-y-3">
              {pattern.data.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.time}</span>
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <Progress value={item.intensity} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pattern.data.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm">{item.trigger}</span>
                  </div>
                  <span className="text-sm font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Recommendations */}
      <Card className="p-6 shadow-soft bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">🎯 Personalized Recommendations</h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-white/70 rounded border-l-4 border-blue-500">
            <div className="font-medium text-sm text-blue-800">Focus Improvement</div>
            <div className="text-sm text-blue-700">
              Try the Pomodoro Technique during your 1-3 PM low-focus window. Block distracting apps for 25-minute intervals.
            </div>
          </div>
          
          <div className="p-3 bg-white/70 rounded border-l-4 border-green-500">
            <div className="font-medium text-sm text-green-800">Habit Replacement</div>
            <div className="text-sm text-green-700">
              Replace evening scroll sessions with reading or journaling. You spend 2.3 hours scrolling after 7 PM.
            </div>
          </div>
          
          <div className="p-3 bg-white/70 rounded border-l-4 border-purple-500">
            <div className="font-medium text-sm text-purple-800">Mindful Usage</div>
            <div className="text-sm text-purple-700">
              Set specific times for social media (e.g., 12-12:30 PM and 6-6:30 PM) to reduce random checking.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};