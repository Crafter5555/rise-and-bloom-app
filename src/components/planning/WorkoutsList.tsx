
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Dumbbell, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScheduleButton } from "@/components/today/ScheduleButton";

interface Workout {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string;
  total_duration_minutes: number;
  created_at: string;
}

interface WorkoutsListProps {
  onRefresh?: () => void;
  onScheduleWorkout?: (workout: Workout) => void;
}

export const WorkoutsList = ({ onRefresh, onScheduleWorkout }: WorkoutsListProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<Record<string, any[]>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWorkouts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
      
      // Fetch scheduled workouts
      await fetchScheduledWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast({
        title: "Error",
        description: "Failed to load workouts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledWorkouts = async (workoutList: Workout[]) => {
    if (!user || workoutList.length === 0) return;
    
    try {
      const workoutIds = workoutList.map(workout => workout.id);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'workout')
        .in('item_id', workoutIds);

      if (error) throw error;
      
      const scheduledByWorkout = data?.reduce((acc, plan) => {
        if (!acc[plan.item_id]) acc[plan.item_id] = [];
        acc[plan.item_id].push(plan);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      setScheduledWorkouts(scheduledByWorkout);
    } catch (error) {
      console.error('Error fetching scheduled workouts:', error);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Workout deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleScheduled = () => {
    fetchWorkouts();
    onRefresh?.();
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading workouts...</div>;
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No workouts created yet</p>
        <p className="text-sm">Create your first workout routine to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const workoutSchedules = scheduledWorkouts[workout.id] || [];
        
        return (
          <Card key={workout.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-foreground">{workout.name}</h4>
                  <Badge className={getDifficultyColor(workout.difficulty_level)}>
                    {workout.difficulty_level}
                  </Badge>
                </div>
                
                {workout.description && (
                  <p className="text-sm text-muted-foreground mb-3">{workout.description}</p>
                )}
                
                {/* Scheduled instances */}
                {workoutSchedules.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-2">Scheduled for:</div>
                    <div className="flex flex-wrap gap-2">
                      {workoutSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(schedule.plan_date), 'MMM d')}
                            {schedule.scheduled_time && ` at ${schedule.scheduled_time}`}
                          </Badge>
                          <ScheduleButton
                            item={{ ...workout, type: 'workout' }}
                            onScheduled={handleScheduled}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            existingPlanId={schedule.id}
                            isRescheduling={true}
                            initialDate={new Date(schedule.plan_date)}
                            initialTime={schedule.scheduled_time}
                            initialDuration={schedule.estimated_duration_minutes}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {workout.total_duration_minutes > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{workout.total_duration_minutes} minutes</span>
                    </div>
                  )}
                  <span>Created {format(new Date(workout.created_at), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    View Exercises
                  </Button>
                  <Button variant="outline" size="sm">
                    Schedule Workout
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <ScheduleButton
                  item={{ ...workout, type: 'workout' }}
                  onScheduled={handleScheduled}
                  variant="outline"
                  size="sm"
                  className="text-primary"
                />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteWorkout(workout.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
