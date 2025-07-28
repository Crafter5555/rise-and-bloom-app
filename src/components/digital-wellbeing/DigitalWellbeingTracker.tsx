import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Clock, Eye, AlertTriangle, Shield, Info } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/use-toast";

interface AppUsageData {
  appName: string;
  timeSpent: number; // minutes
  sessions: number;
  category: string;
  lastUsed: Date;
}

interface DigitalWellbeingState {
  isTrackingEnabled: boolean;
  hasPermissions: boolean;
  canTrackSystemWide: boolean;
  todayScreenTime: number;
  todayPickups: number;
  appUsage: AppUsageData[];
  focusScore: number;
}

export const DigitalWellbeingTracker = () => {
  const [state, setState] = useState<DigitalWellbeingState>({
    isTrackingEnabled: false,
    hasPermissions: false,
    canTrackSystemWide: false,
    todayScreenTime: 0,
    todayPickups: 0,
    appUsage: [],
    focusScore: 0
  });
  
  const { isNative, logError } = useMobile();
  const { toast } = useToast();

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    try {
      if (!isNative) {
        // Web version - limited capabilities
        setState(prev => ({
          ...prev,
          canTrackSystemWide: false,
          hasPermissions: false
        }));
        return;
      }

      // Check if we can access system-level usage data
      const canAccess = await checkSystemUsageAccess();
      
      setState(prev => ({
        ...prev,
        canTrackSystemWide: canAccess,
        hasPermissions: canAccess
      }));

      if (canAccess) {
        loadUsageData();
      }
    } catch (error) {
      logError(error as Error, 'Digital wellbeing capability check');
    }
  };

  const checkSystemUsageAccess = async (): Promise<boolean> => {
    // This would check for actual system permissions
    // For now, we'll simulate based on platform capabilities
    
    if (isNative) {
      // On Android, this would check for PACKAGE_USAGE_STATS permission
      // On iOS, this would check for Screen Time API access
      
      // Simulate permission check
      return new Promise((resolve) => {
        setTimeout(() => {
          // Most apps won't have system-level access due to platform restrictions
          resolve(false);
        }, 1000);
      });
    }
    
    return false;
  };

  const requestPermissions = async () => {
    try {
      if (!isNative) {
        toast({
          title: "Limited on Web",
          description: "Full digital wellbeing tracking requires the mobile app.",
          variant: "destructive"
        });
        return;
      }

      // This would open system settings for usage access
      // Implementation would be platform-specific
      toast({
        title: "Permission Required",
        description: "Please enable usage access in system settings to track app usage.",
      });

      // Simulate opening settings (in real implementation, this would use native APIs)
      console.log("Would open system settings for usage access permission");
      
    } catch (error) {
      logError(error as Error, 'Digital wellbeing permission request');
      toast({
        title: "Permission Error",
        description: "Unable to request usage access permissions.",
        variant: "destructive"
      });
    }
  };

  const loadUsageData = async () => {
    try {
      // This would load actual usage data from system APIs
      // For now, we'll use realistic mock data to demonstrate the UI
      
      const mockData: AppUsageData[] = [
        {
          appName: "Instagram",
          timeSpent: 67,
          sessions: 12,
          category: "Social",
          lastUsed: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        {
          appName: "YouTube",
          timeSpent: 89,
          sessions: 8,
          category: "Entertainment", 
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          appName: "Rise & Bloom",
          timeSpent: 34,
          sessions: 6,
          category: "Productivity",
          lastUsed: new Date()
        }
      ];

      setState(prev => ({
        ...prev,
        todayScreenTime: mockData.reduce((sum, app) => sum + app.timeSpent, 0),
        todayPickups: 47,
        appUsage: mockData,
        focusScore: 7.2,
        isTrackingEnabled: true
      }));

    } catch (error) {
      logError(error as Error, 'Loading usage data');
    }
  };

  const toggleTracking = async (enabled: boolean) => {
    if (enabled && !state.hasPermissions) {
      await requestPermissions();
      return;
    }

    setState(prev => ({ ...prev, isTrackingEnabled: enabled }));
    
    if (enabled) {
      loadUsageData();
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Social': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Productivity': 'bg-green-100 text-green-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  return (
    <div className="space-y-6">
      {/* Capability Status */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {!isNative ? (
            "Digital wellbeing tracking is limited on web. Install the mobile app for full features."
          ) : !state.canTrackSystemWide ? (
            "System-level app tracking requires special permissions that may not be available on all devices. We'll track what we can and allow manual input for the rest."
          ) : (
            "Full digital wellbeing tracking is available on your device."
          )}
        </AlertDescription>
      </Alert>

      {/* Tracking Control */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Digital Wellbeing Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitor your digital habits and screen time
            </p>
          </div>
          <Switch
            checked={state.isTrackingEnabled}
            onCheckedChange={toggleTracking}
          />
        </div>

        {!state.hasPermissions && state.isTrackingEnabled && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              To track system-wide app usage, please grant usage access permissions.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={requestPermissions}
              >
                Grant Permissions
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Usage Statistics */}
      {state.isTrackingEnabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Screen Time</span>
              </div>
              <div className="text-2xl font-bold">{formatTime(state.todayScreenTime)}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Pickups</span>
              </div>
              <div className="text-2xl font-bold">{state.todayPickups}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </Card>
          </div>

          {/* Focus Score */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Focus Score
            </h3>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-purple-600">{state.focusScore}/10</div>
              <p className="text-sm text-muted-foreground">Based on usage patterns</p>
            </div>
            <Progress value={state.focusScore * 10} className="h-3" />
          </Card>

          {/* App Usage Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">App Usage Today</h3>
            <div className="space-y-4">
              {state.appUsage.map((app, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {app.appName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{app.appName}</div>
                      <div className="text-xs text-muted-foreground">
                        {app.sessions} sessions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatTime(app.timeSpent)}</div>
                    <Badge className={getCategoryColor(app.category)} variant="outline">
                      {app.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Privacy Notice */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">Privacy Protected</span>
        </div>
        <p className="text-sm text-green-700">
          All usage data is processed locally on your device when possible. 
          No sensitive app usage information is shared with third parties.
        </p>
      </Card>
    </div>
  );
};