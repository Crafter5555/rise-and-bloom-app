import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { EditTaskDialog } from "@/components/dialogs/EditTaskDialog";

interface DailyPlanItem {
  id: string;
  title: string;
  description?: string;
  item_type: "habit" | "goal" | "task" | "activity" | "workout" | "custom";
  item_id?: string;
  completed: boolean;
  completed_at?: string;
  order_index: number;
  priority?: "low" | "medium" | "high";
  scheduled_time?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
}

export const DailyPlanList = () => {
  const [dailyPlans, setDailyPlans] = useState<DailyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch daily plans for today
  const fetchDailyPlans = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today);

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        item_type: item.item_type as DailyPlanItem['item_type']
      }));
      
      // Sort by scheduled time, then by order index
      const sortedData = typedData.sort((a, b) => {
        // Items with scheduled time come first, sorted by time
        if (a.scheduled_time && b.scheduled_time) {
          return a.scheduled_time.localeCompare(b.scheduled_time);
        }
        if (a.scheduled_time && !b.scheduled_time) return -1;
        if (!a.scheduled_time && b.scheduled_time) return 1;
        
        // If both have no scheduled time, sort by order_index
        return (a.order_index || 0) - (b.order_index || 0);
      });
      
      setDailyPlans(sortedData);
    } catch (error) {
      console.error('Error fetching daily plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyPlans();
  }, [user]);

  const toggleComplete = async (id: string) => {
    try {
      const item = dailyPlans.find(p => p.id === id);
      if (!item) return;

      const newCompleted = !item.completed;
      const updateData = {
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('daily_plans')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setDailyPlans(items => 
        items.map(item => 
          item.id === id 
            ? { ...item, completed: newCompleted, completed_at: updateData.completed_at }
            : item
        )
      );

      // Update source records based on item type
      if (newCompleted && item.item_id) {
        await updateSourceRecord(item.item_type, item.item_id);
      }
    } catch (error) {
      console.error('Error updating daily plan:', error);
    }
  };

  const updateSourceRecord = async (itemType: string, itemId: string) => {
    try {
      switch (itemType) {
        case 'habit':
          // Create habit completion record
          await supabase
            .from('habit_completions')
            .insert({
              user_id: user!.id,
              habit_id: itemId,
              completion_date: today,
              completed_at: new Date().toISOString()
            });
          break;
        case 'task':
          // Mark task as completed
          await supabase
            .from('tasks')
            .update({ 
              completed: true, 
              completed_at: new Date().toISOString() 
            })
            .eq('id', itemId);
          break;
        case 'workout':
          // Mark workout plan as completed
          await supabase
            .from('workout_plans')
            .update({ 
              completed: true, 
              completed_at: new Date().toISOString() 
            })
            .eq('workout_id', itemId)
            .eq('scheduled_date', today);
          break;
      }
    } catch (error) {
      console.error('Error updating source record:', error);
    }
  };

  // Handle clicking on task items to edit them
  const handleTaskClick = async (item: DailyPlanItem) => {
    if (item.item_type === 'task' && item.item_id && !item.completed) {
      try {
        const { data: taskData, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', item.item_id)
          .single();

        if (error) throw error;
        
        setEditingTask(taskData);
        setShowEditDialog(true);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    }
  };

  const handleTaskUpdated = () => {
    fetchDailyPlans();
    setShowEditDialog(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const completedCount = dailyPlans.filter(item => item.completed).length;
  const totalCount = dailyPlans.length;

  if (totalCount === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No plans for today</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding some items to your daily plan
          </p>
        </div>
      </Card>
    );
  }

  const goalItems = dailyPlans.filter(item => item.item_type === 'goal');
  const scheduleItems = dailyPlans.filter(item => item.item_type !== 'goal');

  const renderItem = (item: DailyPlanItem) => (
    <div
      key={item.id}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        item.completed 
          ? "bg-muted/50 border-muted" 
          : "bg-background border-border hover:border-primary/20",
        item.item_type === 'task' && !item.completed && "cursor-pointer"
      )}
      onClick={() => handleTaskClick(item)}
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
        onClick={(e) => {
          e.stopPropagation();
          toggleComplete(item.id);
        }}
      >
        {item.completed && <Check className="w-3 h-3" />}
      </Button>
      
      <div className="flex-1">
        <div className={cn(
          "font-medium",
          item.completed ? "line-through text-muted-foreground" : "text-foreground"
        )}>
          {item.title}
          {item.item_type === 'task' && !item.completed && (
            <span className="text-xs text-muted-foreground ml-2">(click to edit)</span>
          )}
        </div>
        
        {item.description && (
          <div className="text-sm text-muted-foreground mt-1">
            {item.description}
          </div>
        )}
        
        {/* Time and Duration Info */}
        {(item.scheduled_time || item.estimated_duration_minutes) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {item.scheduled_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(`2000-01-01T${item.scheduled_time}`).toLocaleTimeString([], { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            )}
            {item.estimated_duration_minutes && (
              <span>
                ~{item.estimated_duration_minutes < 60 
                  ? `${item.estimated_duration_minutes}m` 
                  : `${Math.floor(item.estimated_duration_minutes / 60)}h ${item.estimated_duration_minutes % 60 > 0 ? `${item.estimated_duration_minutes % 60}m` : ''}`
                }
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant="outline"
            className="text-xs px-2 py-0 capitalize"
          >
            {item.item_type === 'custom' ? 'task' : item.item_type}
          </Badge>
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary font-medium">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
          {/* Total estimated time */}
          {dailyPlans.some(item => item.estimated_duration_minutes) && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(dailyPlans.reduce((total, item) => total + (item.estimated_duration_minutes || 0), 0) / 60)}h {dailyPlans.reduce((total, item) => total + (item.estimated_duration_minutes || 0), 0) % 60}m planned
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mb-6">
        {completedCount}/{totalCount} completed
      </div>

      <div className="space-y-6">
        {/* Goals Section */}
        {goalItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-foreground">Today's Goals</h4>
            </div>
            
            <div className="space-y-2">
              {goalItems.map(renderItem)}
            </div>
          </div>
        )}

        {/* Daily Schedule Section */}
        {scheduleItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-foreground">Daily Schedule</h4>
            </div>
            
            <div className="space-y-2">
              {scheduleItems.map(renderItem)}
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />
    </Card>
  );
};
