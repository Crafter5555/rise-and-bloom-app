
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useEnhancedSync } from "@/hooks/useEnhancedSync";
import { useMobile } from "@/hooks/useMobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bug, 
  Database, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface DebugInfo {
  environment: 'development' | 'production';
  platform: string;
  isNative: boolean;
  isOnline: boolean;
  databaseConnection: 'connected' | 'disconnected' | 'error';
  syncStatus: string;
  pendingActions: number;
  dataSourcesHealth: Record<string, 'healthy' | 'warning' | 'error'>;
}

export const DebugDataView = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { insights, refreshInsights } = useDeviceData();
  const { syncStatus, pendingActionsCount, syncPendingActions } = useEnhancedSync();
  const { isNative, isKeyboardOpen, getData, clearAllData } = useMobile();
  const { user } = useAuth();

  const checkDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      return 'connected';
    } catch (error) {
      console.error('Database connection test failed:', error);
      return 'error';
    }
  };

  const loadDebugInfo = async () => {
    setIsLoading(true);
    try {
      const dbStatus = await checkDatabaseConnection();
      
      // Check data source health
      const dataSourcesHealth: Record<string, 'healthy' | 'warning' | 'error'> = {
        sleep: insights.sleep.source === 'unavailable' ? 'error' : 
               insights.sleep.source === 'manual' ? 'warning' : 'healthy',
        screenTime: insights.screenTime.source === 'unavailable' ? 'error' :
                   insights.screenTime.source === 'estimated' ? 'warning' : 'healthy',
        steps: insights.steps.source === 'unavailable' ? 'error' : 'healthy',
        mood: insights.mood.source === 'unavailable' ? 'warning' : 'healthy',
        water: insights.water.source === 'unavailable' ? 'warning' : 'healthy',
        mindfulness: insights.mindfulness.source === 'unavailable' ? 'warning' : 'healthy'
      };

      const info: DebugInfo = {
        environment: process.env.NODE_ENV as 'development' | 'production',
        platform: isNative ? 'mobile' : 'web',
        isNative,
        isOnline: navigator.onLine,
        databaseConnection: dbStatus,
        syncStatus,
        pendingActions: pendingActionsCount,
        dataSourcesHealth
      };

      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;

    try {
      // Fetch all user data
      const tables = ['habits', 'tasks', 'goals', 'daily_plans', 'habit_completions', 'activities', 'workouts'];
      const userData: Record<string, any> = {};

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data) {
          userData[table] = data;
        }
      }

      // Add insights data
      userData.insights = insights;
      userData.exportDate = new Date().toISOString();
      userData.userId = user.id;

      // Download as JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting user data:', error);
    }
  };

  const clearAllUserData = async () => {
    if (!user || !confirm('Are you sure you want to delete ALL your data? This action cannot be undone.')) return;

    try {
      const tables = ['habit_completions', 'daily_plans', 'habits', 'tasks', 'goals', 'activities', 'workout_plans', 'workouts'];
      
      for (const table of tables) {
        await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);
      }

      await clearAllData(); // Clear local storage
      await refreshInsights();
      await loadDebugInfo();
      
      alert('All user data has been deleted.');
    } catch (error) {
      console.error('Error deleting user data:', error);
      alert('Error deleting data. Please try again.');
    }
  };

  useEffect(() => {
    loadDebugInfo();
    const interval = setInterval(loadDebugInfo, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [insights, syncStatus, pendingActionsCount]);

  if (isLoading || !debugInfo) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Debug Dashboard</h1>
        <Badge variant="outline" className="ml-auto">
          {debugInfo.environment}
        </Badge>
      </div>

      {/* System Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          System Status
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Platform</span>
              <Badge variant={debugInfo.isNative ? "default" : "outline"}>
                {debugInfo.platform}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection</span>
              <div className="flex items-center gap-1">
                {debugInfo.isOnline ? (
                  <><Wifi className="w-4 h-4 text-green-600" /><span className="text-green-600">Online</span></>
                ) : (
                  <><WifiOff className="w-4 h-4 text-red-600" /><span className="text-red-600">Offline</span></>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <div className="flex items-center gap-1">
                <Database className={`w-4 h-4 ${debugInfo.databaseConnection === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
                <span className={debugInfo.databaseConnection === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.databaseConnection}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sync Status</span>
              <Badge variant={debugInfo.syncStatus === 'synced' ? "outline" : "destructive"}>
                {debugInfo.syncStatus}
              </Badge>
            </div>
          </div>
        </div>

        {debugInfo.pendingActions > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {debugInfo.pendingActions} actions pending sync
              </span>
              <Button size="sm" variant="outline" onClick={syncPendingActions} className="ml-auto">
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            </div>
          </div>
        )}

        {isNative && (
          <div className="text-sm text-muted-foreground">
            Keyboard: {isKeyboardOpen ? 'Open' : 'Closed'}
          </div>
        )}
      </Card>

      {/* Data Source Health */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Data Source Health</h2>
        
        <div className="space-y-3">
          {Object.entries(debugInfo.dataSourcesHealth).map(([source, health]) => (
            <div key={source} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getHealthIcon(health)}</span>
                <div>
                  <div className="font-medium capitalize">{source}</div>
                  <div className="text-xs text-muted-foreground">
                    Source: {insights[source as keyof typeof insights]?.source}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${getHealthColor(health)}`}>
                {health}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        
        <div className="space-y-3">
          <Button onClick={exportUserData} className="w-full justify-start gap-2">
            <Download className="w-4 h-4" />
            Export All User Data
          </Button>
          
          <Separator />
          
          <Button 
            onClick={clearAllUserData} 
            variant="destructive" 
            className="w-full justify-start gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All User Data
          </Button>
          <p className="text-xs text-muted-foreground">
            This will permanently delete all your data from both local storage and the cloud. This action cannot be undone.
          </p>
        </div>
      </Card>

      {/* Current Insights Data */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Insights Data</h2>
        
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(insights, null, 2)}
        </pre>
      </Card>
    </div>
  );
};
