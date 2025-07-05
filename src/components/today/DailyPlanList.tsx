import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanItem {
  id: string;
  title: string;
  type: "habit" | "activity" | "task" | "workout";
  completed: boolean;
  streak?: number;
  time?: string;
  priority?: "low" | "medium" | "high";
}

const mockPlanItems: PlanItem[] = [
  { id: "1", title: "Morning journal", type: "habit", completed: false, streak: 4 },
  { id: "2", title: "Drink water", type: "habit", completed: true, streak: 12 },
  { id: "3", title: "10-minute meditation", type: "activity", completed: false },
  { id: "4", title: "Review presentation", type: "task", completed: false, time: "2:00 PM", priority: "high" },
  { id: "5", title: "Upper body workout", type: "workout", completed: false, time: "6:00 PM" },
];

const sectionIcons = {
  habit: "🔁",
  activity: "✨", 
  task: "📌",
  workout: "💪"
};

const sectionTitles = {
  habit: "Habits",
  activity: "Activities", 
  task: "Tasks",
  workout: "Workouts"
};

export const DailyPlanList = () => {
  const [planItems, setPlanItems] = useState(mockPlanItems);

  const toggleComplete = (id: string) => {
    setPlanItems(items => 
      items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const groupedItems = planItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, PlanItem[]>);

  const completedCount = planItems.filter(item => item.completed).length;
  const totalCount = planItems.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">TODAY'S PLAN</h3>
        <span className="text-sm text-primary font-medium">
          {Math.round((completedCount / totalCount) * 100)}%
        </span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-6">
        {completedCount}/{totalCount} completed
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([type, items]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{sectionIcons[type as keyof typeof sectionIcons]}</span>
              <h4 className="font-medium text-foreground">
                {sectionTitles[type as keyof typeof sectionTitles]}
              </h4>
            </div>
            
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    item.completed 
                      ? "bg-muted/50 border-muted" 
                      : "bg-background border-border hover:border-primary/20"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-6 h-6 rounded-full p-0 border-2",
                      item.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted hover:border-primary"
                    )}
                    onClick={() => toggleComplete(item.id)}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </Button>
                  
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      item.completed ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {item.title}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {item.time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                      )}
                      {item.priority && (
                        <Badge 
                          variant={item.priority === "high" ? "destructive" : "secondary"}
                          className="text-xs px-2 py-0"
                        >
                          {item.priority}
                        </Badge>
                      )}
                      {item.streak && item.streak > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Flame className="w-3 h-3" />
                          {item.streak} days
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};