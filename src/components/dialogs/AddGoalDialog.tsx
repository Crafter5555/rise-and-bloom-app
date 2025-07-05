import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalAdded?: () => void;
}

export const AddGoalDialog = ({ open, onOpenChange, onGoalAdded }: AddGoalDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState("custom");
  const [targetDate, setTargetDate] = useState<Date>();
  const [targetValue, setTargetValue] = useState(100);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          period_type: periodType,
          target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
          target_value: targetValue
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal created successfully!"
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPeriodType("custom");
      setTargetDate(undefined);
      setTargetValue(100);
      
      onGoalAdded?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
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
          <DialogTitle className="text-xl font-semibold">Create New Goal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal Title *</Label>
            <Input
              id="goal-title"
              placeholder="e.g., Read 12 books this year"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description (Optional)</Label>
            <Textarea
              id="goal-description"
              placeholder="What do you want to achieve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Period Type</Label>
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Target Value (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 100)}
              />
            </div>
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
            {loading ? "Creating..." : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};