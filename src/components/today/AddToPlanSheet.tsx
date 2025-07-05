import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const activities = [
  "Meditate", "Read", "Walk", "Gratitude", "Stretch", "Call a friend",
  "Listen to music", "Take photos", "Learn something new", "Tidy up"
];

const habits = [
  "Drink water", "Journal", "Exercise", "Take vitamins", "Practice mindfulness",
  "Read news", "Plan tomorrow", "Skincare routine", "Limit social media"
];

interface AddToPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddToPlanSheet = ({ open, onOpenChange }: AddToPlanSheetProps) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedHabit, setSelectedHabit] = useState("");
  const [workoutName, setWorkoutName] = useState("");

  const handleAddTask = () => {
    if (taskTitle.trim()) {
      console.log("Adding task:", taskTitle);
      setTaskTitle("");
      onOpenChange(false);
    }
  };

  const handleAddActivity = (activity: string) => {
    console.log("Adding activity:", activity);
    onOpenChange(false);
  };

  const handleAddHabit = (habit: string) => {
    console.log("Adding habit:", habit);
    onOpenChange(false);
  };

  const handleAddWorkout = () => {
    if (workoutName.trim()) {
      console.log("Adding workout:", workoutName);
      setWorkoutName("");
      onOpenChange(false);
    }
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
            <Label>Choose an activity</Label>
            <div className="grid grid-cols-2 gap-2">
              {activities.map((activity) => (
                <Badge
                  key={activity}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground p-3 justify-center"
                  onClick={() => handleAddActivity(activity)}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="habit" className="space-y-4">
            <Label>Start a new habit</Label>
            <div className="grid grid-cols-2 gap-2">
              {habits.map((habit) => (
                <Badge
                  key={habit}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground p-3 justify-center"
                  onClick={() => handleAddHabit(habit)}
                >
                  {habit}
                </Badge>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="workout" className="space-y-4">
            <div>
              <Label htmlFor="workout-name">Workout name</Label>
              <Input
                id="workout-name"
                placeholder="e.g., Upper body routine"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={handleAddWorkout} className="w-full" disabled={!workoutName.trim()}>
              Schedule Workout
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};