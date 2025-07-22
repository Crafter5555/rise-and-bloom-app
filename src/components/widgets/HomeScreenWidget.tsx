import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Target, CheckCircle, TrendingUp } from "lucide-react";

interface WidgetData {
  todayProgress: number;
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  nextHabit: {
    name: string;
    time: string;
  } | null;
}

export const HomeScreenWidget = () => {
  const [widgetData, setWidgetData] = useState<WidgetData>({
    todayProgress: 0,
    completedHabits: 0,
    totalHabits: 0,
    currentStreak: 0,
    nextHabit: null
  });

  const [widgetCode, setWidgetCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Mock widget data - in real app would come from actual user data
    setWidgetData({
      todayProgress: 73,
      completedHabits: 5,
      totalHabits: 7,
      currentStreak: 12,
      nextHabit: {
        name: "Evening Meditation",
        time: "7:00 PM"
      }
    });
  }, []);

  const generateWidgetCode = async () => {
    setIsGenerating(true);
    
    // Simulate generating widget configuration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const code = `
<!-- Rise & Bloom Widget Configuration -->
<widget-config>
  <size>small</size>
  <update-frequency>300</update-frequency>
  <data-source>api://rise-bloom.app/widget-data</data-source>
  <theme>auto</theme>
  <features>
    <progress-ring enabled="true" />
    <habit-count enabled="true" />
    <next-reminder enabled="true" />
    <streak-counter enabled="true" />
  </features>
</widget-config>`;
    
    setWidgetCode(code);
    setIsGenerating(false);
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
  };

  return (
    <div className="space-y-4">
      {/* Widget Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Home Screen Widget Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Small Widget Preview */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-2xl border-2 border-primary/20 max-w-xs mx-auto">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌸</span>
                  <span className="font-medium text-sm">Rise & Bloom</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {widgetData.currentStreak} day streak
                </Badge>
              </div>
              
              {/* Progress Circle */}
              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <Progress 
                    value={widgetData.todayProgress} 
                    className="h-3 w-24"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {widgetData.completedHabits}/{widgetData.totalHabits} habits completed
                </div>
              </div>
              
              {/* Next Habit */}
              {widgetData.nextHabit && (
                <div className="bg-white/80 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-primary" />
                    <div>
                      <p className="text-xs font-medium">{widgetData.nextHabit.name}</p>
                      <p className="text-xs text-muted-foreground">{widgetData.nextHabit.time}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Widget Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Available Sizes</h4>
                <div className="space-y-1">
                  <Badge variant="outline">Small (2x2)</Badge>
                  <Badge variant="outline">Medium (4x2)</Badge>
                  <Badge variant="outline">Large (4x4)</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Data Display</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• Today's progress</p>
                  <p>• Habit completion count</p>
                  <p>• Current streak</p>
                  <p>• Next scheduled habit</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={generateWidgetCode}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Widget Code"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Code */}
      {widgetCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Widget Installation Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded font-mono text-xs overflow-auto max-h-40">
                <pre>{widgetCode}</pre>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyWidgetCode}
                  className="flex-1"
                >
                  Copy Code
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  Download JSON
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Android:</strong> Long press home screen → Widgets → Rise & Bloom</p>
                <p><strong>iOS:</strong> Long press home screen → + → Rise & Bloom Widget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <h4 className="font-medium">For Android:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Long press on your home screen</li>
                <li>Tap "Widgets" from the menu</li>
                <li>Find "Rise & Bloom" in the widget list</li>
                <li>Drag the widget to your home screen</li>
                <li>Configure the widget size and settings</li>
              </ol>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-medium">For iOS:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Long press on your home screen</li>
                <li>Tap the "+" button in the top-left corner</li>
                <li>Search for "Rise & Bloom" in the widget gallery</li>
                <li>Select your preferred widget size</li>
                <li>Tap "Add Widget" and position it</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};