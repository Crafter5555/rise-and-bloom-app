import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppUsageDashboard } from "@/components/digital-wellbeing/AppUsageDashboard";
import { IntentionalitySettings } from "@/components/digital-wellbeing/IntentionalitySettings";
import { AIReflectionPanel } from "@/components/digital-wellbeing/AIReflectionPanel";
import { BehaviorInsights } from "@/components/digital-wellbeing/BehaviorInsights";
import { IntentionalityPopup } from "@/components/digital-wellbeing/IntentionalityPopup";
import { DigitalWellbeingTracker } from "@/components/digital-wellbeing/DigitalWellbeingTracker";
import { Link } from "react-router-dom";
import { Settings, TrendingUp, Brain, Shield, Smartphone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createDemoDigitalWellbeingData } from "@/utils/digitalWellbeingDemo";

const DigitalWellbeing = () => {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [popupApp, setPopupApp] = useState<string>("");
  const [todayStats, setTodayStats] = useState({
    totalScreenTime: "0m",
    pickups: 0,
    averageSession: "0m",
    focusScore: 0.0
  });

  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Get today's device stats
      const { data: deviceStats } = await supabase
        .from('daily_device_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('stat_date', today)
        .single();

      // Get today's app usage for average session calculation
      const { data: appSessions } = await supabase
        .from('app_usage_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('session_date', today);

      if (deviceStats) {
        const formatTime = (minutes: number) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        };

        const totalSessions = appSessions?.length || 0;
        const avgSessionMinutes = totalSessions > 0 
          ? appSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / totalSessions
          : 0;

        setTodayStats({
          totalScreenTime: formatTime(deviceStats.total_screen_time_minutes || 0),
          pickups: deviceStats.total_pickups || 0,
          averageSession: formatTime(avgSessionMinutes),
          focusScore: deviceStats.focus_score || 0.0
        });
      }
    };

    fetchTodayStats();
  }, [user]);

  const mockTriggerPopup = (appName: string) => {
    setPopupApp(appName);
    setShowPopup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6 safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Digital Peace</span>
            <span className="text-lg">🧘‍♀️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Digital Wellbeing</h1>
        </div>
          <Link to="/stats">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              View Stats
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
      </div>

      {/* Today's Overview */}
      <Card className="p-6 mb-6 shadow-soft">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Today's Digital Health
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">{todayStats.totalScreenTime}</div>
            <div className="text-xs text-muted-foreground">Screen Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning mb-1">{todayStats.pickups}</div>
            <div className="text-xs text-muted-foreground">Phone Pickups</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-muted-foreground mb-1">{todayStats.averageSession}</div>
            <div className="text-xs text-muted-foreground">Avg Session</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-success mb-1">{todayStats.focusScore}/10</div>
            <div className="text-xs text-muted-foreground">Focus Score</div>
          </div>
        </div>
      </Card>

      {/* Demo Data Generator */}
      <Card className="p-4 mb-6 shadow-soft bg-blue-50 border-blue-200">
        <h3 className="text-sm font-semibold mb-3 text-blue-800">🧪 Demo Features</h3>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => mockTriggerPopup("Instagram")}
            className="text-xs"
          >
            Trigger Instagram Pop-up
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => mockTriggerPopup("TikTok")}
            className="text-xs"
          >
            Trigger TikTok Pop-up
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => user && createDemoDigitalWellbeingData(user.id)}
            className="text-xs"
          >
            Generate Demo Data
          </Button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Click "Generate Demo Data" to see how the digital wellbeing tracking works with sample data
        </p>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="text-xs">
            <TrendingUp className="w-4 h-4 mr-1" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">
            <Brain className="w-4 h-4 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="coach" className="text-xs">
            🤖
            Coach
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Shield className="w-4 h-4 mr-1" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DigitalWellbeingTracker />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <BehaviorInsights />
        </TabsContent>

        <TabsContent value="coach" className="space-y-6">
          <AIReflectionPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <IntentionalitySettings />
        </TabsContent>
      </Tabs>

      {/* Intentionality Popup */}
      <IntentionalityPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        appName={popupApp}
      />
    </div>
  );
};

export default DigitalWellbeing;