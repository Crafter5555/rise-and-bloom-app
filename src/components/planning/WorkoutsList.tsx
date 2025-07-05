import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Dumbbell, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
}

export const WorkoutsList = ({ onRefresh }: WorkoutsListProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
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
      {workouts.map((workout) => (
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
      ))}
    </div>
  );
};