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

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitAdded?: () => void;
}

export const AddHabitDialog = ({ open, onOpenChange, onHabitAdded }: AddHabitDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Optional scheduling fields
  const [addToTodaysPlan, setAddToTodaysPlan] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    setLoading(true);
    
    try {
      // Create the habit first
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          frequency,
          target_count: targetCount
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // If user wants to add to today's plan, create daily plan entry
      if (addToTodaysPlan && habitData) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await supabase
          .from('daily_plans')
          .insert({
            user_id: user.id,
            plan_date: today,
            item_type: 'habit',
            item_id: habitData.id,
            title: name.trim(),
            scheduled_time: scheduledTime || null,
            estimated_duration_minutes: estimatedDuration
          });
      }

      toast({
        title: "Success",
        description: addToTodaysPlan 
          ? "Habit created and added to today's plan!"
          : "Habit created successfully!"
      });

      // Reset form
      setName("");
      setDescription("");
      setFrequency("daily");
      setTargetCount(1);
      setAddToTodaysPlan(false);
      setScheduledTime("");
      setEstimatedDuration(30);
      
      onHabitAdded?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
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
          <DialogTitle className="text-xl font-semibold">Create New Habit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Habit Name *</Label>
            <Input
              id="habit-name"
              placeholder="e.g., Drink 8 glasses of water"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-description">Description (Optional)</Label>
            <Textarea
              id="habit-description"
              placeholder="Why is this habit important to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Count</Label>
              <Input
                type="number"
                min="1"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Add to Today's Plan Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-to-todays-plan"
                checked={addToTodaysPlan}
                onChange={(e) => setAddToTodaysPlan(e.target.checked)}
                className="w-4 h-4 rounded border border-input"
              />
              <Label htmlFor="add-to-todays-plan" className="text-sm font-medium">
                Add to today's plan
              </Label>
            </div>

            {addToTodaysPlan && (
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
            disabled={!name.trim() || loading}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Habit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};