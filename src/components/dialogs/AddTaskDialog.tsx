import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded?: () => void;
  defaultDate?: Date;
}

export const AddTaskDialog = ({ open, onOpenChange, onTaskAdded, defaultDate }: AddTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultDate);
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [addToDailyPlan, setAddToDailyPlan] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    setLoading(true);
    
    try {
      // Create the task first
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // If user wants to add to daily plan, create daily plan entry
      if (addToDailyPlan && taskData) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await supabase
          .from('daily_plans')
          .insert({
            user_id: user.id,
            plan_date: today,
            item_type: 'task',
            item_id: taskData.id,
            title: title.trim(),
            scheduled_time: scheduledTime || null,
            estimated_duration_minutes: estimatedDuration
          });
      }

      toast({
        title: "Success",
        description: addToDailyPlan 
          ? "Task created and added to today's plan!"
          : "Task created successfully!"
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(defaultDate);
      setScheduledTime("");
      setEstimatedDuration(30);
      setAddToDailyPlan(false);
      
      onTaskAdded?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              placeholder="e.g., Finish project report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Add to Daily Plan Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-to-plan"
                checked={addToDailyPlan}
                onChange={(e) => setAddToDailyPlan(e.target.checked)}
                className="w-4 h-4 rounded border border-input"
              />
              <Label htmlFor="add-to-plan" className="text-sm font-medium">
                Add to today's plan
              </Label>
            </div>

            {addToDailyPlan && (
              <div className="grid grid-cols-2 gap-4 pl-6">
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
            disabled={!title.trim() || loading}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};