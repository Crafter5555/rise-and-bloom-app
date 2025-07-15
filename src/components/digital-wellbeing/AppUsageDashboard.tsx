import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AppUsageData {
  name: string;
  icon: string;
  timeSpent: string;
  timeSpentMinutes: number;
  pickups: number;
  trend: string;
  category: string;
  lastUsed: string;
  peakHours: string;
}

interface AppCategory {
  id: string;
  name: string;
  color: string;
}

export const AppUsageDashboard = () => {
  const { user } = useAuth();
  const [appUsageData, setAppUsageData] = useState<AppUsageData[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAppCategories = async () => {
      const { data, error } = await supabase
        .from('app_categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching app categories:', error);
        return;
      }
      
      setCategories(data || []);
    };

    const fetchAppUsageData = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get today's usage sessions
      const { data: todaySessions, error: todayError } = await supabase
        .from('app_usage_sessions')
        .select(`
          app_name,
          duration_minutes,
          session_date,
          start_time,
          end_time,
          app_categories (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('session_date', today)
        .order('start_time', { ascending: false });

      // Get yesterday's usage for trend comparison
      const { data: yesterdaySessions, error: yesterdayError } = await supabase
        .from('app_usage_sessions')
        .select('app_name, duration_minutes')
        .eq('user_id', user.id)
        .eq('session_date', yesterday);

      if (todayError) {
        console.error('Error fetching today\'s usage:', todayError);
        return;
      }
      
      if (yesterdayError) {
        console.error('Error fetching yesterday\'s usage:', yesterdayError);
      }

      // Process the data
      const appUsageMap = new Map<string, {
        totalTime: number;
        sessions: number;
        category: string;
        color: string;
        lastUsed: string;
      }>();

      todaySessions?.forEach(session => {
        const appName = session.app_name;
        const duration = session.duration_minutes || 0;
        const category = session.app_categories?.name || 'Other';
        const color = session.app_categories?.color || '#64748b';
        const lastUsed = session.start_time;

        if (appUsageMap.has(appName)) {
          const existing = appUsageMap.get(appName)!;
          existing.totalTime += duration;
          existing.sessions += 1;
          if (new Date(lastUsed) > new Date(existing.lastUsed)) {
            existing.lastUsed = lastUsed;
          }
        } else {
          appUsageMap.set(appName, {
            totalTime: duration,
            sessions: 1,
            category,
            color,
            lastUsed
          });
        }
      });

      // Calculate trends
      const yesterdayUsageMap = new Map<string, number>();
      yesterdaySessions?.forEach(session => {
        const appName = session.app_name;
        const duration = session.duration_minutes || 0;
        yesterdayUsageMap.set(appName, (yesterdayUsageMap.get(appName) || 0) + duration);
      });

      // Convert to display format
      const processedData: AppUsageData[] = Array.from(appUsageMap.entries())
        .map(([appName, usage]) => {
          const yesterdayTime = yesterdayUsageMap.get(appName) || 0;
          const trendPercent = yesterdayTime > 0 
            ? ((usage.totalTime - yesterdayTime) / yesterdayTime) * 100
            : usage.totalTime > 0 ? 100 : 0;
          
          const trend = trendPercent > 0 ? `+${trendPercent.toFixed(0)}%` : `${trendPercent.toFixed(0)}%`;
          
          const formatTime = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          };

          const getRelativeTime = (timestamp: string) => {
            const now = new Date();
            const then = new Date(timestamp);
            const diffMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
            
            if (diffMinutes < 60) return `${diffMinutes} min ago`;
            if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
            return `${Math.floor(diffMinutes / 1440)}d ago`;
          };

          // Simple app icons
          const getAppIcon = (name: string) => {
            const iconMap: { [key: string]: string } = {
              'Instagram': '📸',
              'TikTok': '🎵',
              'YouTube': '▶️',
              'Twitter': '🐦',
              'X': '🐦',
              'LinkedIn': '💼',
              'Reddit': '🤖',
              'WhatsApp': '💬',
              'Facebook': '👥',
              'Snapchat': '👻',
              'Rise and Bloom': '🌸'
            };
            return iconMap[name] || '📱';
          };

          return {
            name: appName,
            icon: getAppIcon(appName),
            timeSpent: formatTime(usage.totalTime),
            timeSpentMinutes: usage.totalTime,
            pickups: usage.sessions,
            trend,
            category: usage.category,
            lastUsed: getRelativeTime(usage.lastUsed),
            peakHours: "Various" // Could be calculated with more detailed data
          };
        })
        .sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes);

      setAppUsageData(processedData);
      setLastSynced(new Date());
      setLoading(false);
    };

    fetchAppCategories();
    fetchAppUsageData();
  }, [user]);

  const maxTimeSpent = Math.max(...appUsageData.map(app => app.timeSpentMinutes), 1);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">App Usage Today</h3>
            <div className="text-xs text-muted-foreground">Loading...</div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
                    <div>
                      <div className="w-20 h-4 bg-muted rounded animate-pulse mb-1"></div>
                      <div className="w-32 h-3 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-4 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">App Usage Today</h3>
          <div className="text-xs text-muted-foreground">
            Synced {lastSynced.toLocaleTimeString()}
          </div>
        </div>
        
        {appUsageData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h4 className="text-lg font-medium mb-2">No app usage data yet</h4>
            <p className="text-sm text-muted-foreground">
              Start tracking your app usage to see insights here
            </p>
          </div>
        ) : (
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
        )}
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