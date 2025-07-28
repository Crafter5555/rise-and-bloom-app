
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useDeviceData } from "@/hooks/useDeviceData";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InsightsPanel = () => {
  const { insights, isLoading, refreshInsights } = useDeviceData();

  const getInsightData = () => [
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    { 
      icon: "😴", 
      label: "Sleep", 
      value: insights.sleep.hours || "Not tracked", 
      color: "text-blue-600",
      source: insights.sleep.source,
      quality: insights.sleep.quality
    },
    { 
      icon: "📱", 
      label: "Screen Time", 
      value: insights.screenTime.total || "Not available", 
      color: "text-orange-600",
      source: insights.screenTime.source
    },
    { 
      icon: "😊", 
      label: "Mood", 
      value: insights.mood.value || "Not set", 
      color: "text-green-600",
      source: insights.mood.source
    },
    { 
      icon: "👣", 
      label: "Steps", 
      value: insights.steps.count ? insights.steps.count.toLocaleString() : "Not tracked", 
      color: "text-purple-600",
      source: insights.steps.source
    },
    { 
      icon: "💧", 
      label: "Water", 
      value: insights.water.cups || "0/8 cups", 
      color: "text-cyan-600",
      source: insights.water.source
    },
    { 
      icon: "🧘", 
      label: "Mindful", 
      value: insights.mindfulness.minutes || "0 min", 
      color: "text-indigo-600",
      source: insights.mindfulness.source
    },
  ];

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'device':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Device</Badge>;
      case 'manual':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Manual</Badge>;
      case 'estimated':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Estimated</Badge>;
      case 'quiz':
        return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Quiz</Badge>;
      case 'timer':
        return <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">Timer</Badge>;
      default:
        return <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          N/A
        </Badge>;
    }
  };

  const handleRefresh = async () => {
    await refreshInsights();
    setLastRefresh(new Date());
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
          Today's Insights
        </h3>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="flex-shrink-0 p-3 min-w-[100px] animate-pulse">
                <div className="text-center">
                  <div className="w-6 h-6 bg-muted rounded mb-2 mx-auto"></div>
                  <div className="w-12 h-4 bg-muted rounded mb-1 mx-auto"></div>
                  <div className="w-8 h-3 bg-muted rounded mx-auto"></div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const insightData = getInsightData();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Today's Insights
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {insightData.map((insight, index) => (
            <Card key={index} className="flex-shrink-0 p-3 min-w-[100px] relative">
              <div className="text-center">
                <div className="text-xl mb-1">{insight.icon}</div>
                <div className={`text-sm font-semibold ${insight.color} mb-1`}>
                  {insight.value}
                  {insight.quality && (
                    <div className="text-xs text-muted-foreground">
                      Quality: {insight.quality}/10
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {insight.label}
                </div>
                {getSourceBadge(insight.source)}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
