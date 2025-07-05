import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  name: string;
}

interface ScheduleItem {
  id: string;
  workoutId: string;
  workoutName: string;
  dayOfWeek: number;
  timeOfDay?: string;
}

interface AddRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoutineAdded?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

export const AddRoutineDialog = ({ open, onOpenChange, onRoutineAdded }: AddRoutineDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWorkouts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const addScheduleItem = () => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      workoutId: "",
      workoutName: "",
      dayOfWeek: 1, // Monday
      timeOfDay: ""
    };
    setSchedule([...schedule, newItem]);
  };

  const removeScheduleItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: any) => {
    setSchedule(schedule.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If workout is changed, update workout name
        if (field === 'workoutId') {
          const workout = workouts.find(w => w.id === value);
          updatedItem.workoutName = workout?.name || "";
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!user || !name.trim() || schedule.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a name and at least one scheduled workout.",
        variant: "destructive"
      });
      return;
    }

    // Validate all schedule items have workouts selected
    const invalidItems = schedule.filter(item => !item.workoutId);
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a workout for all scheduled items.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create routine
      const { data: routine, error: routineError } = await supabase
        .from('workout_routines')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Create schedule items
      const scheduleInserts = schedule.map(item => ({
        routine_id: routine.id,
        workout_id: item.workoutId,
        day_of_week: item.dayOfWeek,
        time_of_day: item.timeOfDay || null
      }));

      const { error: scheduleError } = await supabase
        .from('routine_schedules')
        .insert(scheduleInserts);

      if (scheduleError) throw scheduleError;

      // Generate initial workout plans
      const { data: plansCreated, error: generateError } = await supabase
        .rpc('generate_routine_workout_plans', {
          target_user_id: user.id,
          days_ahead: 14
        });

      if (generateError) {
        console.warn('Warning: Could not auto-generate plans:', generateError);
      }

      toast({
        title: "Success",
        description: `Routine created successfully! ${plansCreated || 0} workout plans generated.`
      });

      // Reset form
      setName("");
      setDescription("");
      setSchedule([]);
      
      onRoutineAdded?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating routine:', error);
      toast({
        title: "Error",
        description: "Failed to create routine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWorkouts();
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create Workout Routine
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine Name *</Label>
            <Input
              id="routine-name"
              placeholder="e.g., Weekly Strength Training"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-description">Description (Optional)</Label>
            <Textarea
              id="routine-description"
              placeholder="Describe your workout routine..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Weekly Schedule</Label>
              <Button
                onClick={addScheduleItem}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                disabled={workouts.length === 0}
              >
                <Plus className="w-4 h-4" />
                Add Workout Day
              </Button>
            </div>

            {workouts.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  You need to create some workouts first before creating a routine.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Go to the Workouts tab to create your first workout.
                </p>
              </Card>
            ) : schedule.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  No workouts scheduled yet. Click "Add Workout Day" to start building your routine.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedule.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Day</Label>
                          <Select
                            value={item.dayOfWeek.toString()}
                            onValueChange={(value) => updateScheduleItem(item.id, 'dayOfWeek', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map(day => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Workout</Label>
                          <Select
                            value={item.workoutId}
                            onValueChange={(value) => updateScheduleItem(item.id, 'workoutId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select workout" />
                            </SelectTrigger>
                            <SelectContent>
                              {workouts.map(workout => (
                                <SelectItem key={workout.id} value={workout.id}>
                                  {workout.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Time (Optional)</Label>
                          <Input
                            type="time"
                            value={item.timeOfDay}
                            onChange={(e) => updateScheduleItem(item.id, 'timeOfDay', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => removeScheduleItem(item.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {schedule.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Schedule Preview</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {schedule.map((item) => {
                  const day = DAYS_OF_WEEK.find(d => d.value === item.dayOfWeek);
                  return (
                    <Badge key={item.id} variant="secondary" className="text-xs">
                      {day?.label}: {item.workoutName || 'Select workout'}
                      {item.timeOfDay && ` at ${item.timeOfDay}`}
                    </Badge>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || schedule.length === 0 || loading}
            className="flex-1"
          >
            {loading ? "Creating Routine..." : "Create Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};