import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RoutineSchedule {
  id?: string;
  workout_id: string;
  workout_name?: string;
  day_of_week: number;
  time_of_day: string | null;
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface EditRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: Routine | null;
  onRoutineUpdated?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export const EditRoutineDialog = ({ open, onOpenChange, routine, onRoutineUpdated }: EditRoutineDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schedules, setSchedules] = useState<RoutineSchedule[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (routine) {
      setName(routine.name || "");
      setDescription(routine.description || "");
      setIsActive(routine.is_active ?? true);
      fetchSchedules();
    }
    fetchWorkouts();
  }, [routine]);

  const fetchSchedules = async () => {
    if (!routine) return;
    
    try {
      const { data, error } = await supabase
        .from('routine_schedules')
        .select(`
          *,
          workouts!inner(name)
        `)
        .eq('routine_id', routine.id);

      if (error) throw error;
      
      const schedulesWithWorkoutNames = (data || []).map(schedule => ({
        ...schedule,
        workout_name: schedule.workouts?.name
      }));
      
      setSchedules(schedulesWithWorkoutNames);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

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

  const addSchedule = () => {
    const newSchedule: RoutineSchedule = {
      workout_id: workouts[0]?.id || '',
      day_of_week: 1,
      time_of_day: '09:00'
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof RoutineSchedule, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update workout name for display
    if (field === 'workout_id') {
      const workout = workouts.find(w => w.id === value);
      updated[index].workout_name = workout?.name;
    }
    
    setSchedules(updated);
  };

  const handleSave = async () => {
    if (!user || !routine || !name.trim()) return;

    setLoading(true);
    
    try {
      // Update routine
      const { error: routineError } = await supabase
        .from('workout_routines')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive
        })
        .eq('id', routine.id);

      if (routineError) throw routineError;

      // Delete existing schedules
      const { error: deleteError } = await supabase
        .from('routine_schedules')
        .delete()
        .eq('routine_id', routine.id);

      if (deleteError) throw deleteError;

      // Insert updated schedules
      if (schedules.length > 0) {
        const schedulesToInsert = schedules
          .filter(schedule => schedule.workout_id)
          .map(schedule => ({
            routine_id: routine.id,
            workout_id: schedule.workout_id,
            day_of_week: schedule.day_of_week,
            time_of_day: schedule.time_of_day
          }));

        if (schedulesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('routine_schedules')
            .insert(schedulesToInsert);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Routine updated successfully!"
      });

      onRoutineUpdated?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating routine:', error);
      toast({
        title: "Error",
        description: "Failed to update routine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!routine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Routine</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
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
                placeholder="What is this routine about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Active Routine</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Weekly Schedule</Label>
              <Button onClick={addSchedule} size="sm" disabled={workouts.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>

            {workouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No workouts available.</p>
                <p className="text-sm">Create some workouts first to add them to routines.</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schedule set yet. Click "Add Schedule" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Schedule {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchedule(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Workout</Label>
                          <Select 
                            value={schedule.workout_id} 
                            onValueChange={(value) => updateSchedule(index, 'workout_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
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
                        
                        <div className="space-y-2">
                          <Label>Day of Week</Label>
                          <Select 
                            value={schedule.day_of_week.toString()} 
                            onValueChange={(value) => updateSchedule(index, 'day_of_week', parseInt(value))}
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
                        
                        <div className="space-y-2">
                          <Label>Time (Optional)</Label>
                          <Input
                            type="time"
                            value={schedule.time_of_day || ''}
                            onChange={(e) => updateSchedule(index, 'time_of_day', e.target.value || null)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                        </Badge>
                        {schedule.time_of_day && (
                          <Badge variant="outline">
                            {schedule.time_of_day}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {schedule.workout_name}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
            disabled={!name.trim() || loading}
            className="flex-1"
          >
            {loading ? "Updating..." : "Update Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};