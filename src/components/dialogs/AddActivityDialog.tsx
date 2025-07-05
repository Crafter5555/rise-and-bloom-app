import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityAdded?: () => void;
}

export const AddActivityDialog = ({ open, onOpenChange, onActivityAdded }: AddActivityDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          category,
          duration_minutes: durationMinutes,
          is_favorite: isFavorite
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity created successfully!"
      });

      // Reset form
      setName("");
      setDescription("");
      setCategory("general");
      setDurationMinutes(30);
      setIsFavorite(false);
      
      onActivityAdded?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity. Please try again.",
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
          <DialogTitle className="text-xl font-semibold">Create New Activity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name *</Label>
            <Input
              id="activity-name"
              placeholder="e.g., Morning meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-description">Description (Optional)</Label>
            <Textarea
              id="activity-description"
              placeholder="What does this activity involve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="favorite-toggle">Mark as favorite</Label>
            <Switch
              id="favorite-toggle"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
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
            {loading ? "Creating..." : "Create Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};