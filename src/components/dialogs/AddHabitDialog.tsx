import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          frequency,
          target_count: targetCount
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit created successfully!"
      });

      // Reset form
      setName("");
      setDescription("");
      setFrequency("daily");
      setTargetCount(1);
      
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