import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  title?: string;
  name?: string;
  type: "task" | "habit" | "activity" | "workout" | "goal";
}

interface UniversalScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onScheduled?: () => void;
}

export const UniversalScheduleModal = ({ 
  open, 
  onOpenChange, 
  item, 
  onScheduled 
}: UniversalScheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!user || !item) return;

    setLoading(true);
    
    try {
      const itemTitle = item.title || item.name || "Untitled";
      
      const { error } = await supabase
        .from('daily_plans')
        .insert({
          user_id: user.id,
          plan_date: format(selectedDate, 'yyyy-MM-dd'),
          item_type: item.type,
          item_id: item.id,
          title: itemTitle,
          scheduled_time: scheduledTime || null,
          estimated_duration_minutes: estimatedDuration
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${itemTitle} scheduled for ${format(selectedDate, 'PPP')}${scheduledTime ? ` at ${new Date(`2000-01-01T${scheduledTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}`
      });

      // Reset form
      setSelectedDate(new Date());
      setScheduledTime("");
      setEstimatedDuration(30);
      
      onScheduled?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error scheduling item:', error);
      toast({
        title: "Error",
        description: "Failed to schedule item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemDisplayName = () => {
    return item?.title || item?.name || "Item";
  };

  const getItemTypeDisplayName = () => {
    switch (item?.type) {
      case 'task': return 'Task';
      case 'habit': return 'Habit';
      case 'activity': return 'Activity';
      case 'workout': return 'Workout';
      case 'goal': return 'Goal';
      default: return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Schedule {getItemTypeDisplayName()}
          </DialogTitle>
        </DialogHeader>
        
        {item && (
          <div className="space-y-4 py-4">
            {/* Item Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-foreground">{getItemDisplayName()}</div>
              <div className="text-sm text-muted-foreground capitalize">{item.type}</div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time (optional)
                </Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Estimated Duration</Label>
                <Select value={estimatedDuration.toString()} onValueChange={(value) => setEstimatedDuration(parseInt(value))}>
                  <SelectTrigger>
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
          </div>
        )}

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
            onClick={handleSchedule}
            disabled={!item || loading}
            className="flex-1"
          >
            {loading ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};