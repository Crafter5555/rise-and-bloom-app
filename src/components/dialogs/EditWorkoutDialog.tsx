import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration_seconds: number;
  rest_seconds: number;
  order_index: number;
}

interface Workout {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  total_duration_minutes: number | null;
}

interface EditWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout | null;
  onWorkoutUpdated?: () => void;
}

export const EditWorkoutDialog = ({ open, onOpenChange, workout, onWorkoutUpdated }: EditWorkoutDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (workout) {
      setName(workout.name || "");
      setDescription(workout.description || "");
      setDifficultyLevel(workout.difficulty_level || "beginner");
      fetchExercises();
    }
  }, [workout]);

  const fetchExercises = async () => {
    if (!workout) return;
    
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workout.id)
        .order('order_index');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      exercise_name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      duration_seconds: 0,
      rest_seconds: 60,
      order_index: exercises.length
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const calculateTotalDuration = () => {
    return exercises.reduce((total, exercise) => {
      const exerciseTime = exercise.duration_seconds > 0 ? 
        exercise.duration_seconds : 
        (exercise.sets * exercise.reps * 3); // Estimate 3 seconds per rep
      return total + exerciseTime + (exercise.rest_seconds * exercise.sets);
    }, 0) / 60; // Convert to minutes
  };

  const handleSave = async () => {
    if (!user || !workout || !name.trim()) return;

    setLoading(true);
    
    try {
      const totalDuration = Math.round(calculateTotalDuration());
      
      // Update workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          difficulty_level: difficultyLevel,
          total_duration_minutes: totalDuration
        })
        .eq('id', workout.id);

      if (workoutError) throw workoutError;

      // Delete existing exercises
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workout.id);

      if (deleteError) throw deleteError;

      // Insert updated exercises
      if (exercises.length > 0) {
        const exercisesToInsert = exercises
          .filter(ex => ex.exercise_name.trim())
          .map((exercise, index) => ({
            workout_id: workout.id,
            exercise_name: exercise.exercise_name.trim(),
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration_seconds: exercise.duration_seconds,
            rest_seconds: exercise.rest_seconds,
            order_index: index
          }));

        if (exercisesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('workout_exercises')
            .insert(exercisesToInsert);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Workout updated successfully!"
      });

      onWorkoutUpdated?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating workout:', error);
      toast({
        title: "Error",
        description: "Failed to update workout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!workout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Workout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name *</Label>
              <Input
                id="workout-name"
                placeholder="e.g., Upper Body Strength"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-description">Description (Optional)</Label>
            <Textarea
              id="workout-description"
              placeholder="What is this workout about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Exercises</Label>
              <Button onClick={addExercise} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exercises added yet. Click "Add Exercise" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Exercise {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Input
                        placeholder="Exercise name"
                        value={exercise.exercise_name}
                        onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                      />
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <Label className="text-xs">Sets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Weight (lbs)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={exercise.weight}
                            onChange={(e) => updateExercise(index, 'weight', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duration (sec)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={exercise.duration_seconds}
                            onChange={(e) => updateExercise(index, 'duration_seconds', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rest (sec)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={exercise.rest_seconds}
                            onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || 60)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {exercises.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Estimated total duration: {Math.round(calculateTotalDuration())} minutes
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
            {loading ? "Updating..." : "Update Workout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};