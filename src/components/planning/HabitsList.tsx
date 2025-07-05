import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Circle, Edit2, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface HabitsListProps {
  onRefresh?: () => void;
  onScheduleHabit?: (habit: Habit) => void;
}

export const HabitsList = ({ onRefresh, onScheduleHabit }: HabitsListProps) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHabits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitActive = async (habitId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: isActive })
        .eq('id', habitId);

      if (error) throw error;

      setHabits(prev => 
        prev.map(habit => 
          habit.id === habitId ? { ...habit, is_active: isActive } : habit
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error", 
        description: "Failed to update habit",
        variant: "destructive"
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Habit deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit", 
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading habits...</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No habits created yet</p>
        <p className="text-sm">Create your first habit to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <Card key={habit.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-foreground">{habit.name}</h4>
                <Badge variant={habit.frequency === 'daily' ? 'default' : 'secondary'}>
                  {habit.frequency}
                </Badge>
                {habit.target_count > 1 && (
                  <Badge variant="outline">{habit.target_count}x</Badge>
                )}
              </div>
              
              {habit.description && (
                <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={habit.is_active}
                    onCheckedChange={(checked) => toggleHabitActive(habit.id, checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {habit.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(habit.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary"
                onClick={() => onScheduleHabit?.(habit)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteHabit(habit.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};