import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Moon, Zap, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  goal?: number;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface BiometricData {
  date: string;
  heartRate: number;
  steps: number;
  sleepHours: number;
  energy: number;
}

export const HealthIntegration = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);

  useEffect(() => {
    // Mock health metrics
    const mockMetrics: HealthMetric[] = [
      {
        id: '1',
        name: 'Heart Rate',
        value: 72,
        unit: 'bpm',
        trend: 'stable',
        icon: Heart,
        color: 'text-red-500'
      },
      {
        id: '2',
        name: 'Daily Steps',
        value: 8420,
        unit: 'steps',
        goal: 10000,
        trend: 'up',
        icon: Activity,
        color: 'text-blue-500'
      },
      {
        id: '3',
        name: 'Sleep Quality',
        value: 85,
        unit: '%',
        goal: 90,
        trend: 'up',
        icon: Moon,
        color: 'text-purple-500'
      },
      {
        id: '4',
        name: 'Energy Level',
        value: 7.2,
        unit: '/10',
        trend: 'stable',
        icon: Zap,
        color: 'text-yellow-500'
      }
    ];

    // Mock biometric data for past week
    const mockBiometricData: BiometricData[] = [
      { date: 'Mon', heartRate: 70, steps: 8500, sleepHours: 7.5, energy: 7 },
      { date: 'Tue', heartRate: 72, steps: 9200, sleepHours: 8, energy: 8 },
      { date: 'Wed', heartRate: 69, steps: 7800, sleepHours: 6.5, energy: 6 },
      { date: 'Thu', heartRate: 71, steps: 10100, sleepHours: 7.8, energy: 7.5 },
      { date: 'Fri', heartRate: 74, steps: 8900, sleepHours: 7.2, energy: 7 },
      { date: 'Sat', heartRate: 68, steps: 12000, sleepHours: 8.5, energy: 8.5 },
      { date: 'Sun', heartRate: 72, steps: 8420, sleepHours: 8, energy: 7.2 }
    ];

    setHealthMetrics(mockMetrics);
    setBiometricData(mockBiometricData);
    setConnectedApps(['Apple Health', 'Google Fit']);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const connectHealthApp = (app: string) => {
    // In real implementation, this would handle OAuth flow
    setConnectedApps(prev => [...prev, app]);
  };

  return (
    <div className="space-y-4">
      {/* Health Metrics Overview */}
      <div className="grid grid-cols-2 gap-3">
        {healthMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs">{getTrendIcon(metric.trend)}</span>
                </div>
                <div className="text-lg font-semibold">
                  {metric.value}{metric.unit}
                </div>
                <div className="text-xs text-muted-foreground">{metric.name}</div>
                {metric.goal && (
                  <Progress 
                    value={(metric.value / metric.goal) * 100} 
                    className="h-1 mt-2"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Biometric Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-green-600" />
            Health Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={biometricData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#eab308" 
                strokeWidth={2}
                name="Energy Level"
              />
              <Line 
                type="monotone" 
                dataKey="sleepHours" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Sleep Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health App Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="w-4 h-4 text-blue-600" />
            Connected Health Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectedApps.map((app, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{app}</span>
                </div>
                <Badge variant="outline">Connected</Badge>
              </div>
            ))}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => connectHealthApp('Fitbit')}
              >
                + Connect Fitbit
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => connectHealthApp('Strava')}
              >
                + Connect Strava
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900">Sleep Impact</h4>
              <p className="text-xs text-blue-700 mt-1">
                Your energy levels are 23% higher on days with 8+ hours of sleep
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm text-green-900">Activity Boost</h4>
              <p className="text-xs text-green-700 mt-1">
                Days with 10k+ steps show 18% better mood ratings
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-sm text-purple-900">Recovery Needed</h4>
              <p className="text-xs text-purple-700 mt-1">
                Your heart rate variability suggests taking a rest day tomorrow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};