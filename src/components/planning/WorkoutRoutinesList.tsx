import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash2, Calendar, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WorkoutRoutine {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  schedules: {
    id: string;
    day_of_week: number;
    time_of_day: string | null;
    workout: {
      id: string;
      name: string;
    };
  }[];
}

interface WorkoutRoutinesListProps {
  onRefresh?: () => void;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export const WorkoutRoutinesList = ({ onRefresh }: WorkoutRoutinesListProps) => {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRoutines = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select(`
          *,
          schedules:routine_schedules(
            id,
            day_of_week,
            time_of_day,
            workout:workouts(id, name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      toast({
        title: "Error",
        description: "Failed to load workout routines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workout_routines')
        .update({ is_active: isActive })
        .eq('id', routineId);

      if (error) throw error;

      setRoutines(prev => 
        prev.map(routine => 
          routine.id === routineId ? { ...routine, is_active: isActive } : routine
        )
      );

      onRefresh?.();

      toast({
        title: "Success",
        description: `Routine ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating routine:', error);
      toast({
        title: "Error", 
        description: "Failed to update routine",
        variant: "destructive"
      });
    }
  };

  const regeneratePlans = async (routineId: string) => {
    if (!user) return;
    
    setRegenerating(routineId);
    
    try {
      const { data: plansCreated, error } = await supabase
        .rpc('generate_routine_workout_plans', {
          target_user_id: user.id,
          days_ahead: 14
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${plansCreated || 0} new workout plans for the next 2 weeks`
      });
    } catch (error) {
      console.error('Error regenerating plans:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate workout plans",
        variant: "destructive"
      });
    } finally {
      setRegenerating(null);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    try {
      const { error } = await supabase
        .from('workout_routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;

      setRoutines(prev => prev.filter(routine => routine.id !== routineId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Routine deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast({
        title: "Error",
        description: "Failed to delete routine", 
        variant: "destructive"
      });
    }
  };

  const getScheduleSummary = (schedules: WorkoutRoutine['schedules']) => {
    const sortedSchedules = [...schedules].sort((a, b) => a.day_of_week - b.day_of_week);
    
    return sortedSchedules.map(schedule => ({
      day: DAYS_OF_WEEK[schedule.day_of_week],
      workout: schedule.workout.name,
      time: schedule.time_of_day
    }));
  };

  useEffect(() => {
    fetchRoutines();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading routines...</div>;
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No workout routines created yet</p>
        <p className="text-sm">Create your first routine to automate your workout planning</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routines.map((routine) => {
        const scheduleSummary = getScheduleSummary(routine.schedules);
        
        return (
          <Card key={routine.id} className={`p-6 ${routine.is_active ? 'border-green-200 bg-green-50' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-foreground">{routine.name}</h4>
                  <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                    {routine.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {routine.description && (
                  <p className="text-sm text-muted-foreground mb-3">{routine.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>Created {format(new Date(routine.created_at), 'MMM d, yyyy')}</span>
                  <span>{routine.schedules.length} workout{routine.schedules.length !== 1 ? 's' : ''} per week</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Switch
                    checked={routine.is_active}
                    onCheckedChange={(checked) => toggleRoutineActive(routine.id, checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {routine.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => regeneratePlans(routine.id)}
                  disabled={regenerating === routine.id}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating === routine.id ? 'animate-spin' : ''}`} />
                  {regenerating === routine.id ? 'Generating...' : 'Regenerate Plans'}
                </Button>
                
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteRoutine(routine.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Schedule Display */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm text-foreground mb-3">Weekly Schedule:</h5>
              <div className="grid gap-2">
                {scheduleSummary.map((schedule, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-background rounded-md border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="min-w-[70px] justify-center">
                        {schedule.day}
                      </Badge>
                      <span className="font-medium text-sm">{schedule.workout}</span>
                    </div>
                    {schedule.time && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{schedule.time}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {routine.is_active && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ This routine is automatically generating workout plans for your scheduled days
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};