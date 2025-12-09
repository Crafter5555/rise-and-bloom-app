import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Target, Calendar, RefreshCw, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { EditTaskDialog } from "@/components/dialogs/EditTaskDialog";
import { ScheduleButton } from "@/components/today/ScheduleButton";
import { PlanEditModal } from "@/components/today/PlanEditModal";
import { useToast } from "@/hooks/use-toast";

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
  plan_date: string;
}

export const DailyPlanList = () => {
  const [dailyPlans, setDailyPlans] = useState<DailyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPlanEditModal, setShowPlanEditModal] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
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
      
      // Debug logging to see what we're getting
      console.log('Fetched daily plans:', data);
      data?.forEach(item => {
        console.log(`Item: ${item.title}, scheduled_time: ${item.scheduled_time}, type: ${typeof item.scheduled_time}`);
      });
      
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
      toast({
        title: "Sync Error",
        description: "Unable to load latest data. Working with cached version.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLastSyncTime(new Date());
    }
  };

  // Clean up orphaned daily plan entries
  const cleanupOrphanedEntries = async () => {
    if (!user) return;
    
    setCleaningUp(true);
    try {
      // Get all daily plans with item_id
      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .not('item_id', 'is', null);

      if (plansError) throw plansError;

      const orphanedIds: string[] = [];

      // Check each plan to see if its source item still exists
      for (const plan of plans || []) {
        let exists = false;
        
        switch (plan.item_type) {
          case 'task':
            const { data: task } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', plan.item_id)
              .single();
            exists = !!task;
            break;
          case 'habit':
            const { data: habit } = await supabase
              .from('habits')
              .select('id')
              .eq('id', plan.item_id)
              .single();
            exists = !!habit;
            break;
          case 'activity':
            const { data: activity } = await supabase
              .from('activities')
              .select('id')
              .eq('id', plan.item_id)
              .single();
            exists = !!activity;
            break;
          case 'workout':
            const { data: workout } = await supabase
              .from('workouts')
              .select('id')
              .eq('id', plan.item_id)
              .single();
            exists = !!workout;
            break;
        }

        if (!exists) {
          orphanedIds.push(plan.id);
        }
      }

      // Remove orphaned entries
      if (orphanedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('daily_plans')
          .delete()
          .in('id', orphanedIds);

        if (deleteError) throw deleteError;

        toast({
          title: "Cleanup Complete",
          description: `Removed ${orphanedIds.length} orphaned entries from your daily plan`
        });

        // Refresh the list
        fetchDailyPlans();
      } else {
        toast({
          title: "No Cleanup Needed",
          description: "Your daily plan is already up to date"
        });
      }
    } catch (error) {
      console.error('Error cleaning up orphaned entries:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean up orphaned entries",
        variant: "destructive"
      });
    } finally {
      setCleaningUp(false);
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

      // Optimistic update for immediate UI feedback
      setDailyPlans(items => 
        items.map(item => 
          item.id === id 
            ? { ...item, completed: newCompleted, completed_at: updateData.completed_at }
            : item
        )
      );

      const { error } = await supabase
        .from('daily_plans')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update source records based on item type
      if (newCompleted && item.item_id) {
        await updateSourceRecord(item.item_type, item.item_id);
      }
      
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error updating daily plan:', error);
      // Revert optimistic update on error - refetch to get correct state
      fetchDailyPlans();
      toast({
        title: "Update Failed",
        description: "Unable to save changes. Please try again.",
        variant: "destructive"
      });
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

  const handleRescheduled = () => {
    fetchDailyPlans();
  };

  // Enhanced format time display with better debugging
  const formatTime = (timeString: string | undefined | null) => {
    console.log('formatTime called with:', timeString, typeof timeString);
    
    if (!timeString) {
      console.log('No time string provided');
      return null;
    }
    
    try {
      // Handle different time formats from database
      let hours: number, minutes: number;
      
      if (timeString.includes(':')) {
        const parts = timeString.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      } else {
        console.log('Unexpected time format:', timeString);
        return timeString;
      }
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      const formatted = date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      console.log(`Formatted ${timeString} to ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('Error formatting time:', error, 'for timeString:', timeString);
      return timeString;
    }
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
          <Button 
            onClick={cleanupOrphanedEntries} 
            disabled={cleaningUp}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", cleaningUp && "animate-spin")} />
            Clean up orphaned entries
          </Button>
        </div>
      </Card>
    );
  }

  const goalItems = dailyPlans.filter(item => item.item_type === 'goal');
  const scheduleItems = dailyPlans.filter(item => item.item_type !== 'goal');

  const renderItem = (item: DailyPlanItem) => {
    console.log(`Rendering item: ${item.title}, scheduled_time: ${item.scheduled_time}`);
    
    return (
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
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {item.scheduled_time && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">{formatTime(item.scheduled_time)}</span>
                </div>
              )}
              {item.estimated_duration_minutes && (
                <div className="flex items-center gap-1">
                  <span>
                    {item.estimated_duration_minutes < 60 
                      ? `${item.estimated_duration_minutes}min` 
                      : `${Math.floor(item.estimated_duration_minutes / 60)}h ${item.estimated_duration_minutes % 60 > 0 ? `${item.estimated_duration_minutes % 60}m` : ''}`
                    }
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2">
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

        {/* Edit Schedule Button */}
        {!item.completed && item.item_id && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <ScheduleButton
              item={{
                id: item.item_id,
                title: item.title,
                type: item.item_type as any
              }}
              onScheduled={handleRescheduled}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              existingPlanId={item.id}
              isRescheduling={true}
              initialDate={new Date(item.plan_date)}
              initialTime={item.scheduled_time}
              initialDuration={item.estimated_duration_minutes}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">TODAY'S PLAN</h3>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowPlanEditModal(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Plan
          </Button>
          <Button 
            onClick={cleanupOrphanedEntries} 
            disabled={cleaningUp}
            variant="ghost"
            size="sm"
            className="gap-2 text-xs"
          >
            <RefreshCw className={cn("w-3 h-3", cleaningUp && "animate-spin")} />
            Cleanup
          </Button>
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

      {/* Plan Edit Modal */}
      <PlanEditModal
        open={showPlanEditModal}
        onOpenChange={setShowPlanEditModal}
        onPlanUpdated={fetchDailyPlans}
      />
    </Card>
  );
};
