import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Brain, Clock, Target, Zap } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  type: 'habit' | 'motivation' | 'reminder' | 'insight';
  smartTiming: boolean;
}

export const SmartNotifications = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'morning_motivation',
      title: 'Morning Motivation',
      description: 'Personalized motivation based on your goals',
      enabled: true,
      type: 'motivation',
      smartTiming: true
    },
    {
      id: 'habit_reminders',
      title: 'Smart Habit Reminders',
      description: 'AI-timed reminders when you\'re most likely to succeed',
      enabled: true,
      type: 'habit',
      smartTiming: true
    },
    {
      id: 'energy_insights',
      title: 'Energy Level Insights',
      description: 'Notifications about your energy patterns',
      enabled: false,
      type: 'insight',
      smartTiming: true
    },
    {
      id: 'goal_check_in',
      title: 'Goal Check-ins',
      description: 'Weekly progress reviews and adjustments',
      enabled: true,
      type: 'reminder',
      smartTiming: false
    }
  ]);

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      try {
        const permission = await LocalNotifications.requestPermissions();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.log('Notification permission error:', error);
      }
    };

    requestPermissions();
  }, []);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'motivation': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'habit': return <Target className="w-4 h-4 text-blue-500" />;
      case 'reminder': return <Clock className="w-4 h-4 text-green-500" />;
      case 'insight': return <Brain className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const testNotification = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Rise & Bloom",
            body: "Great job staying on track today! 🌟",
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (error) {
      console.log('Test notification error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getTypeIcon(setting.type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{setting.title}</h4>
                      {setting.smartTiming && (
                        <Badge variant="outline" className="text-xs">
                          AI-Timed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                />
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testNotification}
              className="w-full"
            >
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Smart Timing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              AI analyzes your behavior patterns to send notifications when you're most likely to:
            </div>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Be available and receptive
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Have high energy for habits
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Need motivation most
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};