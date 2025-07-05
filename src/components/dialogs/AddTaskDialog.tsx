import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addToToday, setAddToToday] = useState(true);
  const [scheduleTask, setScheduleTask] = useState(false);

  const handleSave = () => {
    // Here you would save the task to your data store
    console.log("Saving task:", { taskTitle, description, addToToday, scheduleTask });
    
    // Reset form
    setTaskTitle("");
    setDescription("");
    setAddToToday(true);
    setScheduleTask(false);
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">
              Task Title *
            </Label>
            <Input
              id="task-title"
              placeholder="Enter task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-today" className="text-sm font-medium">
                Add to today&apos;s plan
              </Label>
              <Switch
                id="add-today"
                checked={addToToday}
                onCheckedChange={setAddToToday}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="schedule" className="text-sm font-medium">
                Schedule this task
              </Label>
              <Switch
                id="schedule"
                checked={scheduleTask}
                onCheckedChange={setScheduleTask}
              />
            </div>
          </div>

          {scheduleTask && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Automatic tasks will be added to every day&apos;s plan without requiring manual selection.
              </p>
            </div>
          )}
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
            disabled={!taskTitle.trim()}
            className="flex-1"
          >
            Save Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};