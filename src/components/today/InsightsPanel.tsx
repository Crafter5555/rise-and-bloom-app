import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const insights = [
  { icon: "😴", label: "Sleep", value: "7h 45m", color: "text-blue-600" },
  { icon: "📱", label: "Screen Time", value: "38 min", color: "text-orange-600" },
  { icon: "😊", label: "Mood", value: "Good", color: "text-green-600" },
  { icon: "👣", label: "Steps", value: "6,300", color: "text-purple-600" },
  { icon: "💧", label: "Water", value: "4/8 cups", color: "text-cyan-600" },
  { icon: "🧘", label: "Mindful", value: "15 min", color: "text-indigo-600" },
];

export const InsightsPanel = () => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        Today's Insights
      </h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {insights.map((insight, index) => (
            <Card key={index} className="flex-shrink-0 p-3 min-w-[100px]">
              <div className="text-center">
                <div className="text-xl mb-1">{insight.icon}</div>
                <div className={`text-sm font-semibold ${insight.color}`}>
                  {insight.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {insight.label}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};