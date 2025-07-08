import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Check, Target, CheckCircle, Dumbbell, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
}

type ItemType = "task" | "habit" | "activity" | "workout" | "custom";

const itemTypes: { type: ItemType; icon: any; label: string; color: string }[] = [
  { type: "task", icon: CheckCircle, label: "Task", color: "bg-blue-100 text-blue-700" },
  { type: "habit", icon: Check, label: "Habit", color: "bg-green-100 text-green-700" },
  { type: "activity", icon: Calendar, label: "Activity", color: "bg-purple-100 text-purple-700" },
  { type: "workout", icon: Dumbbell, label: "Workout", color: "bg-orange-100 text-orange-700" },
  { type: "custom", icon: Plus, label: "Custom", color: "bg-gray-100 text-gray-700" },
];

export const QuickAddSheet = ({ open, onOpenChange, onItemAdded }: QuickAddSheetProps) => {
  const [selectedType, setSelectedType] = useState<ItemType>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [creating, setCreating] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  const reset = () => {
    setTitle("");
    setDescription("");
    setDuration("30");
    setPriority("medium");
    setSelectedType("task");
  };

  const handleCreate = async () => {
    if (!user || !title.trim()) return;

    setCreating(true);
    try {
      if (selectedType === "custom") {
        // Create directly in daily_plans
        const { error } = await supabase
          .from('daily_plans')
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            item_type: 'custom',
            plan_date: today,
            estimated_duration_minutes: parseInt(duration) || 30,
            completed: false
          });

        if (error) throw error;
      } else {
        // Create in appropriate table first
        let itemId: string;
        
        switch (selectedType) {
          case "task":
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .insert({
                user_id: user.id,
                title: title.trim(),
                description: description.trim() || null,
                priority,
                completed: false
              })
              .select('id')
              .single();

            if (taskError) throw taskError;
            itemId = taskData.id;
            break;

          case "habit":
            const { data: habitData, error: habitError } = await supabase
              .from('habits')
              .insert({
                user_id: user.id,
                name: title.trim(),
                description: description.trim() || null,
                frequency: 'daily',
                target_count: 1,
                is_active: true
              })
              .select('id')
              .single();

            if (habitError) throw habitError;
            itemId = habitData.id;
            break;

          case "activity":
            const { data: activityData, error: activityError } = await supabase
              .from('activities')
              .insert({
                user_id: user.id,
                name: title.trim(),
                description: description.trim() || null,
                category: 'general',
                duration_minutes: parseInt(duration) || 30
              })
              .select('id')
              .single();

            if (activityError) throw activityError;
            itemId = activityData.id;
            break;

          case "workout":
            const { data: workoutData, error: workoutError } = await supabase
              .from('workouts')
              .insert({
                user_id: user.id,
                name: title.trim(),
                description: description.trim() || null,
                difficulty_level: 'beginner',
                total_duration_minutes: parseInt(duration) || 30
              })
              .select('id')
              .single();

            if (workoutError) throw workoutError;
            itemId = workoutData.id;
            break;

          default:
            throw new Error('Invalid item type');
        }

        // Add to daily plan
        const { error: planError } = await supabase
          .from('daily_plans')
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            item_type: selectedType,
            item_id: itemId,
            plan_date: today,
            estimated_duration_minutes: parseInt(duration) || 30,
            completed: false
          });

        if (planError) throw planError;
      }

      toast({
        title: "Added to Today's Plan",
        description: `${title} has been added to your daily plan`
      });

      reset();
      onItemAdded();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to your plan",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-6 rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle>Quick Add to Today</SheetTitle>
        </SheetHeader>

        {/* Item Type Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-3 block">
            What would you like to add?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {itemTypes.map(({ type, icon: Icon, label, color }) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => setSelectedType(type)}
                className="justify-start gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Enter ${selectedType} title...`}
            autoFocus
          />
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Description (optional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details..."
            rows={2}
          />
        </div>

        {/* Duration & Priority */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Duration (min)
            </label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="5"
              max="480"
            />
          </div>

          {selectedType === "task" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Priority
              </label>
              <div className="flex gap-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className="flex-1 text-xs"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            className="flex-1"
          >
            {creating ? "Adding..." : "Add to Today"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};