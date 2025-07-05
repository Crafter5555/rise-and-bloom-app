import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanItem {
  id: string;
  title: string;
  type: "goal" | "plan";
  completed: boolean;
  time?: string;
  priority?: "low" | "medium" | "high";
}

const mockGoals: PlanItem[] = [
  { id: "g1", title: "Finish presentation slides", type: "goal", completed: false, priority: "high" },
  { id: "g2", title: "Exercise for 30 minutes", type: "goal", completed: false },
  { id: "g3", title: "Read 20 pages", type: "goal", completed: true },
];

const mockPlanItems: PlanItem[] = [
  { id: "p1", title: "Morning journal", type: "plan", completed: false, time: "7:00 AM" },
  { id: "p2", title: "Team standup", type: "plan", completed: true, time: "9:00 AM" },
  { id: "p3", title: "Work on presentation", type: "plan", completed: false, time: "10:00 AM" },
  { id: "p4", title: "Lunch break", type: "plan", completed: false, time: "12:30 PM" },
  { id: "p5", title: "Client call", type: "plan", completed: false, time: "2:00 PM", priority: "high" },
  { id: "p6", title: "Gym workout", type: "plan", completed: false, time: "6:00 PM" },
  { id: "p7", title: "Evening reading", type: "plan", completed: false, time: "8:00 PM" },
];

export const DailyPlanList = () => {
  const [goals, setGoals] = useState(mockGoals);
  const [planItems, setPlanItems] = useState(mockPlanItems);

  const toggleComplete = (id: string, type: "goal" | "plan") => {
    if (type === "goal") {
      setGoals(items => 
        items.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    } else {
      setPlanItems(items => 
        items.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const allItems = [...goals, ...planItems];
  const completedCount = allItems.filter(item => item.completed).length;
  const totalCount = allItems.length;

  const renderItem = (item: PlanItem) => (
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
        onClick={() => toggleComplete(item.id, item.type)}
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
        </div>
      </div>
    </div>
  );

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
        {/* Goals Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-foreground">Today's Goals</h4>
          </div>
          
          <div className="space-y-2">
            {goals.map(renderItem)}
          </div>
        </div>

        {/* Daily Plan Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-foreground">Daily Schedule</h4>
          </div>
          
          <div className="space-y-2">
            {planItems.map(renderItem)}
          </div>
        </div>
      </div>
    </Card>
  );
};