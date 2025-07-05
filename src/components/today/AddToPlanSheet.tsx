import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface UserHabit {
  id: string;
  name: string;
}

interface UserActivity {
  id: string;
  name: string;
}

interface UserWorkout {
  id: string;
  name: string;
}

interface AddToPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanAdded?: () => void;
}

export const AddToPlanSheet = ({ open, onOpenChange, onPlanAdded }: AddToPlanSheetProps) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [userHabits, setUserHabits] = useState<UserHabit[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch user's existing items
  const fetchUserItems = async () => {
    if (!user) return;
    
    try {
      const [habitsResult, activitiesResult, workoutsResult] = await Promise.all([
        supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
        supabase.from('activities').select('id, name').eq('user_id', user.id),
        supabase.from('workouts').select('id, name').eq('user_id', user.id)
      ]);

      if (habitsResult.data) setUserHabits(habitsResult.data);
      if (activitiesResult.data) setUserActivities(activitiesResult.data);
      if (workoutsResult.data) setUserWorkouts(workoutsResult.data);
    } catch (error) {
      console.error('Error fetching user items:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUserItems();
    }
  }, [open, user]);

  const addToDailyPlan = async (itemType: string, title: string, itemId?: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('daily_plans')
        .insert({
          user_id: user.id,
          plan_date: today,
          item_type: itemType,
          item_id: itemId,
          title: title,
          completed: false,
          order_index: 0
        });

      if (error) throw error;
      
      toast.success(`${title} added to today's plan!`);
      onPlanAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to daily plan:', error);
      toast.error('Failed to add to plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (taskTitle.trim()) {
      await addToDailyPlan('custom', taskTitle.trim());
      setTaskTitle("");
    }
  };

  const handleAddHabit = async (habit: UserHabit) => {
    await addToDailyPlan('habit', habit.name, habit.id);
  };

  const handleAddActivity = async (activity: UserActivity) => {
    await addToDailyPlan('activity', activity.name, activity.id);
  };

  const handleAddWorkout = async (workout: UserWorkout) => {
    await addToDailyPlan('workout', workout.name, workout.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Add to Plan</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="task" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="task">📌 Task</TabsTrigger>
            <TabsTrigger value="activity">✨ Activity</TabsTrigger>
            <TabsTrigger value="habit">🔁 Habit</TabsTrigger>
            <TabsTrigger value="workout">💪 Workout</TabsTrigger>
          </TabsList>
          
          <TabsContent value="task" className="space-y-4">
            <div>
              <Label htmlFor="task-title">What do you need to do?</Label>
              <Input
                id="task-title"
                placeholder="e.g., Review presentation"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={handleAddTask} className="w-full" disabled={!taskTitle.trim()}>
              Add Task
            </Button>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Label>Choose an activity from your collection</Label>
            {userActivities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {userActivities.map((activity) => (
                  <Badge
                    key={activity.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground p-3 justify-center"
                    onClick={() => handleAddActivity(activity)}
                  >
                    {activity.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No activities created yet</p>
                <p className="text-sm">Create activities in the Planning page first</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="habit" className="space-y-4">
            <Label>Add a habit to today's plan</Label>
            {userHabits.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {userHabits.map((habit) => (
                  <Badge
                    key={habit.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground p-3 justify-center"
                    onClick={() => handleAddHabit(habit)}
                  >
                    {habit.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No habits created yet</p>
                <p className="text-sm">Create habits in the Planning page first</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="workout" className="space-y-4">
            <Label>Select a workout to schedule</Label>
            {userWorkouts.length > 0 ? (
              <div className="space-y-2">
                {userWorkouts.map((workout) => (
                  <Button
                    key={workout.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddWorkout(workout)}
                    disabled={loading}
                  >
                    {workout.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No workouts created yet</p>
                <p className="text-sm">Create workouts in the Planning page first</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};