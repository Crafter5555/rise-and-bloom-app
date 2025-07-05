import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const AppUsageDashboard = () => {
  // Mock app usage data
  const appUsageData = [
    {
      name: "Instagram",
      icon: "📸",
      timeSpent: "1h 23m",
      timeSpentMinutes: 83,
      pickups: 12,
      trend: "+15%",
      category: "Social",
      lastUsed: "2 min ago",
      peakHours: "8-10 PM"
    },
    {
      name: "TikTok", 
      icon: "🎵",
      timeSpent: "54m",
      timeSpentMinutes: 54,
      pickups: 8,
      trend: "-8%",
      category: "Entertainment",
      lastUsed: "15 min ago",
      peakHours: "6-8 PM"
    },
    {
      name: "YouTube",
      icon: "▶️",
      timeSpent: "1h 12m",
      timeSpentMinutes: 72,
      pickups: 5,
      trend: "+22%", 
      category: "Entertainment",
      lastUsed: "1h ago",
      peakHours: "7-9 PM"
    },
    {
      name: "Twitter/X",
      icon: "🐦",
      timeSpent: "32m",
      timeSpentMinutes: 32,
      pickups: 15,
      trend: "+45%",
      category: "Social",
      lastUsed: "5 min ago",
      peakHours: "12-2 PM"
    },
    {
      name: "LinkedIn",
      icon: "💼",
      timeSpent: "18m",
      timeSpentMinutes: 18,
      pickups: 3,
      trend: "-12%",
      category: "Professional",
      lastUsed: "3h ago",
      peakHours: "9-11 AM"
    },
    {
      name: "Reddit",
      icon: "🤖",
      timeSpent: "45m",
      timeSpentMinutes: 45,
      pickups: 7,
      trend: "+5%",
      category: "Social",
      lastUsed: "30 min ago",
      peakHours: "10-12 PM"
    }
  ];

  const maxTimeSpent = Math.max(...appUsageData.map(app => app.timeSpentMinutes));

  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-warning';
    if (trend.startsWith('-')) return 'text-success';
    return 'text-muted-foreground';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Social': return 'bg-blue-100 text-blue-800';
      case 'Entertainment': return 'bg-purple-100 text-purple-800';
      case 'Professional': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">App Usage Today</h3>
        
        <div className="space-y-4">
          {appUsageData.map((app, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{app.icon}</div>
                  <div>
                    <div className="font-medium text-foreground">{app.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.pickups} pickups • Peak: {app.peakHours}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{app.timeSpent}</div>
                  <div className={`text-xs ${getTrendColor(app.trend)}`}>
                    {app.trend} vs yesterday
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress 
                  value={(app.timeSpentMinutes / maxTimeSpent) * 100} 
                  className="flex-1 h-2"
                />
                <Badge variant="outline" className={`text-xs ${getCategoryColor(app.category)}`}>
                  {app.category}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Last used: {app.lastUsed}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Summary */}
      <Card className="p-4 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">This Week's Patterns</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600">📱</span>
              <span className="font-medium text-orange-800">Peak Usage Alert</span>
            </div>
            <p className="text-sm text-orange-700">
              You've spent 73% more time on social media this week. Your longest session was 2h 15m on Instagram yesterday evening.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">🎯</span>
              <span className="font-medium text-green-800">Positive Trend</span>
            </div>
            <p className="text-sm text-green-700">
              Great job! You reduced TikTok usage by 32% and increased focus time by 18% compared to last week.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};