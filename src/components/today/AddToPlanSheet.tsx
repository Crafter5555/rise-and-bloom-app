import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { Clock } from "lucide-react";

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

interface UserTask {
  id: string;
  title: string;
  priority?: string;
  due_date?: string;
}

interface AddToPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanAdded?: () => void;
}

export const AddToPlanSheet = ({ open, onOpenChange, onPlanAdded }: AddToPlanSheetProps) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [userHabits, setUserHabits] = useState<UserHabit[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch user's existing items
  const fetchUserItems = async () => {
    if (!user) return;
    
    try {
      const [habitsResult, activitiesResult, workoutsResult, tasksResult] = await Promise.all([
        supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
        supabase.from('activities').select('id, name').eq('user_id', user.id),
        supabase.from('workouts').select('id, name').eq('user_id', user.id),
        supabase.from('tasks').select('id, title, priority, due_date').eq('user_id', user.id).eq('completed', false)
      ]);

      if (habitsResult.data) setUserHabits(habitsResult.data);
      if (activitiesResult.data) setUserActivities(activitiesResult.data);
      if (workoutsResult.data) setUserWorkouts(workoutsResult.data);
      if (tasksResult.data) setUserTasks(tasksResult.data);
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
          order_index: 0,
          scheduled_time: scheduledTime || null,
          estimated_duration_minutes: estimatedDuration
        });

      if (error) throw error;
      
      toast.success(`${title} added to today's plan!`);
      onPlanAdded?.();
      
      // Reset form
      setTaskTitle("");
      setScheduledTime("");
      setEstimatedDuration(30);
      
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
  
  const handleAddExistingTask = async (task: UserTask) => {
    await addToDailyPlan('task', task.title, task.id);
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
            {/* Existing Tasks Section */}
            {userTasks.length > 0 && (
              <>
                <div>
                  <Label>Select from your existing tasks</Label>
                  <div className="space-y-2 mt-2">
                    {userTasks.map((task) => (
                      <Button
                        key={task.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => handleAddExistingTask(task)}
                        disabled={loading}
                      >
                        <span>{task.title}</span>
                        <div className="flex items-center gap-2">
                          {task.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {task.priority}
                            </Badge>
                          )}
                          {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                              Due: {format(new Date(task.due_date), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              </>
            )}
            
            {/* Custom Task Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">
                  {userTasks.length > 0 ? "Create a new task" : "What do you need to do?"}
                </Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Review presentation"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              {/* Time and Duration Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled-time">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time (optional)
                  </Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Duration</Label>
                  <Select value={estimatedDuration.toString()} onValueChange={(value) => setEstimatedDuration(parseInt(value))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button onClick={handleAddTask} className="w-full" disabled={!taskTitle.trim() || loading}>
              Add New Task
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