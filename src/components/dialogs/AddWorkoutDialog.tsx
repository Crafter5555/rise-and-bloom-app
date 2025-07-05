import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
}

interface AddWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddWorkoutDialog = ({ open, onOpenChange }: AddWorkoutDialogProps) => {
  const [workoutName, setWorkoutName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: "1",
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0
    }
  ]);

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const handleSave = () => {
    // Here you would save the workout to your data store
    console.log("Saving workout:", { workoutName, description, exercises });
    
    // Reset form
    setWorkoutName("");
    setDescription("");
    setExercises([{
      id: "1",
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0
    }]);
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Workout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="workout-name" className="text-sm font-medium">
              Workout Name *
            </Label>
            <Input
              id="workout-name"
              placeholder="Enter workout name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="workout-description"
              placeholder="Enter workout description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Exercises</Label>
              <Button
                onClick={addExercise}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </Button>
            </div>

            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Exercise {index + 1}</h4>
                  {exercises.length > 1 && (
                    <Button
                      onClick={() => removeExercise(exercise.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={exercise.duration}
                      onChange={(e) => updateExercise(exercise.id, 'duration', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!workoutName.trim() || exercises.some(ex => !ex.name.trim())}
            className="flex-1"
          >
            Save Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};