import { useState, useEffect } from "react";
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

interface Activity {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  is_favorite: boolean | null;
}

interface EditActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onActivityUpdated?: () => void;
}

export const EditActivityDialog = ({ open, onOpenChange, activity, onActivityUpdated }: EditActivityDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [duration, setDuration] = useState(30);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (activity) {
      setName(activity.name || "");
      setDescription(activity.description || "");
      setCategory(activity.category || "general");
      setDuration(activity.duration_minutes || 30);
      setIsFavorite(activity.is_favorite ?? false);
    }
  }, [activity]);

  const handleSave = async () => {
    if (!user || !activity || !name.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category,
          duration_minutes: duration,
          is_favorite: isFavorite
        })
        .eq('id', activity.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity updated successfully!"
      });

      onActivityUpdated?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Activity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name *</Label>
            <Input
              id="activity-name"
              placeholder="e.g., Reading books"
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
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-favorite">Favorite Activity</Label>
            <Switch
              id="is-favorite"
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
            {loading ? "Updating..." : "Update Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};