
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, GripVertical, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DailyPlanItem {
  id: string;
  title: string;
  description?: string;
  item_type: "habit" | "goal" | "task" | "activity" | "workout" | "custom";
  item_id?: string;
  completed: boolean;
  completed_at?: string;
  order_index: number;
  priority?: "low" | "medium" | "high";
  scheduled_time?: string;
  estimated_duration_minutes?: number;
  plan_date: string;
}

interface PlanEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanUpdated: () => void;
}

export const PlanEditModal = ({ open, onOpenChange, onPlanUpdated }: PlanEditModalProps) => {
  const [dailyPlans, setDailyPlans] = useState<DailyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch daily plans when modal opens
  useEffect(() => {
    if (open && user) {
      fetchDailyPlans();
    }
  }, [open, user]);

  const fetchDailyPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .order('order_index');

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        item_type: item.item_type as DailyPlanItem['item_type']
      }));
      
      setDailyPlans(typedData);
    } catch (error) {
      console.error('Error fetching daily plans:', error);
      toast({
        title: "Error",
        description: "Failed to load daily plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlanItem = (id: string, updates: Partial<DailyPlanItem>) => {
    setDailyPlans(items => 
      items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removePlanItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDailyPlans(items => items.filter(item => item.id !== id));
      
      toast({
        title: "Item Removed",
        description: "Item removed from today's plan"
      });
    } catch (error) {
      console.error('Error removing plan item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      
      // Update all items with their new order and times
      const updates = dailyPlans.map((item, index) => ({
        id: item.id,
        scheduled_time: item.scheduled_time,
        estimated_duration_minutes: item.estimated_duration_minutes,
        order_index: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('daily_plans')
          .update({
            scheduled_time: update.scheduled_time,
            estimated_duration_minutes: update.estimated_duration_minutes,
            order_index: update.order_index
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Plan Updated",
        description: "Your daily plan has been updated successfully"
      });

      onPlanUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save plan changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...dailyPlans];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setDailyPlans(newItems);
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  const parseTimeInput = (timeInput: string) => {
    if (!timeInput) return null;
    try {
      // Handle various input formats
      const time = new Date(`2000-01-01 ${timeInput}`);
      if (isNaN(time.getTime())) return null;
      
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}:00`;
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Today's Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Today's Plan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {dailyPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items in today's plan
            </div>
          ) : (
            dailyPlans.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="cursor-move text-muted-foreground mt-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.item_type === 'custom' ? 'task' : item.item_type}
                          </Badge>
                          {item.priority && (
                            <Badge 
                              variant={item.priority === "high" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlanItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Scheduled Time</Label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={item.scheduled_time?.slice(0, 5) || ""}
                            onChange={(e) => {
                              const timeValue = e.target.value ? `${e.target.value}:00` : undefined;
                              updatePlanItem(item.id, { scheduled_time: timeValue });
                            }}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Duration (minutes)</Label>
                        <Input
                          type="number"
                          min="5"
                          max="480"
                          step="5"
                          value={item.estimated_duration_minutes || ""}
                          onChange={(e) => {
                            const duration = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            updatePlanItem(item.id, { estimated_duration_minutes: duration });
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total planned time: {Math.floor(dailyPlans.reduce((total, item) => total + (item.estimated_duration_minutes || 0), 0) / 60)}h {dailyPlans.reduce((total, item) => total + (item.estimated_duration_minutes || 0), 0) % 60}m
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
