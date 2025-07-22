import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Clock, Eye, TrendingDown } from "lucide-react";

interface AppUsage {
  name: string;
  timeSpent: number; // in minutes
  pickups: number;
  category: string;
  healthScore: number;
}

export const AppUsageDashboard = () => {
  const [appUsage, setAppUsage] = useState<AppUsage[]>([]);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [totalPickups, setTotalPickups] = useState(0);

  useEffect(() => {
    // Mock app usage data - in real app would come from device APIs
    const mockData: AppUsage[] = [
      { name: "Social Media", timeSpent: 127, pickups: 23, category: "Social", healthScore: 2 },
      { name: "Rise & Bloom", timeSpent: 45, pickups: 8, category: "Productivity", healthScore: 9 },
      { name: "News Apps", timeSpent: 67, pickups: 15, category: "Information", healthScore: 4 },
      { name: "Meditation Apps", timeSpent: 25, pickups: 3, category: "Wellness", healthScore: 10 },
      { name: "Games", timeSpent: 89, pickups: 18, category: "Entertainment", healthScore: 3 }
    ];

    setAppUsage(mockData);
    setTotalScreenTime(mockData.reduce((sum, app) => sum + app.timeSpent, 0));
    setTotalPickups(mockData.reduce((sum, app) => sum + app.pickups, 0));
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 8) return { label: "Healthy", variant: "default" as const };
    if (score >= 6) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Concerning", variant: "destructive" as const };
  };


  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Screen Time</p>
                <p className="text-lg font-semibold">{Math.floor(totalScreenTime / 60)}h {totalScreenTime % 60}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pickups</p>
                <p className="text-lg font-semibold">{totalPickups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            App Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appUsage.map((app, index) => {
              const percentage = (app.timeSpent / totalScreenTime) * 100;
              const healthBadge = getHealthBadge(app.healthScore);
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{app.name}</span>
                      <Badge variant={healthBadge.variant} className="text-xs">
                        {healthBadge.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.floor(app.timeSpent / 60)}h {app.timeSpent % 60}m
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.pickups} pickups
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total screen time
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Digital Wellness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            Digital Wellness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">7.2</div>
              <p className="text-sm text-muted-foreground">out of 10</p>
            </div>
            <Progress value={72} className="h-3" />
            <div className="text-sm text-muted-foreground">
              <p>• Reduce social media by 30 minutes for better balance</p>
              <p>• Great job maintaining healthy productivity app usage!</p>
              <p>• Consider more intentional breaks between sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};