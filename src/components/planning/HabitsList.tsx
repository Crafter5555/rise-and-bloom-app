
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
import { ScheduleButton } from "@/components/today/ScheduleButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [scheduledHabits, setScheduledHabits] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<{ habit: Habit; scheduledDates: string[] } | null>(null);
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
      
      // Fetch scheduled habits
      await fetchScheduledHabits(data || []);
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

  const fetchScheduledHabits = async (habitList: Habit[]) => {
    if (!user || habitList.length === 0) return;
    
    try {
      const habitIds = habitList.map(habit => habit.id);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'habit')
        .in('item_id', habitIds);

      if (error) throw error;
      
      const scheduledByHabit = data?.reduce((acc, plan) => {
        if (!acc[plan.item_id]) acc[plan.item_id] = [];
        acc[plan.item_id].push(plan);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      setScheduledHabits(scheduledByHabit);
    } catch (error) {
      console.error('Error fetching scheduled habits:', error);
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

  const handleDeleteHabit = (habit: Habit) => {
    const scheduledDates = scheduledHabits[habit.id]?.map(plan => 
      format(new Date(plan.plan_date), 'MMM d, yyyy')
    ) || [];
    
    setHabitToDelete({ habit, scheduledDates });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;

    try {
      // Delete the habit - triggers will automatically clean up daily_plans
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitToDelete.habit.id);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitToDelete.habit.id));
      setScheduledHabits(prev => {
        const updated = { ...prev };
        delete updated[habitToDelete.habit.id];
        return updated;
      });
      
      onRefresh?.();

      toast({
        title: "Success",
        description: habitToDelete.scheduledDates.length > 0 
          ? `Habit deleted and removed from ${habitToDelete.scheduledDates.length} scheduled day(s)`
          : "Habit deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit", 
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  const handleScheduled = () => {
    fetchHabits();
    onRefresh?.();
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
    <>
      <div className="space-y-3">
        {habits.map((habit) => {
          const habitSchedules = scheduledHabits[habit.id] || [];
          
          return (
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
                  
                  {/* Scheduled instances */}
                  {habitSchedules.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-2">Scheduled for:</div>
                      <div className="flex flex-wrap gap-2">
                        {habitSchedules.map((schedule) => (
                          <div key={schedule.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(schedule.plan_date), 'MMM d')}
                              {schedule.scheduled_time && ` at ${schedule.scheduled_time}`}
                            </Badge>
                            <ScheduleButton
                              item={{ ...habit, type: 'habit' }}
                              onScheduled={handleScheduled}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              existingPlanId={schedule.id}
                              isRescheduling={true}
                              initialDate={new Date(schedule.plan_date)}
                              initialTime={schedule.scheduled_time}
                              initialDuration={schedule.estimated_duration_minutes}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
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
                  <ScheduleButton
                    item={{ ...habit, type: 'habit' }}
                    onScheduled={handleScheduled}
                    variant="outline"
                    size="sm"
                    className="text-primary"
                  />
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteHabit(habit)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habitToDelete?.habit.name}"?
              {habitToDelete?.scheduledDates && habitToDelete.scheduledDates.length > 0 && (
                <>
                  <br /><br />
                  <strong>This habit is scheduled for:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {habitToDelete.scheduledDates.map((date, index) => (
                      <li key={index}>{date}</li>
                    ))}
                  </ul>
                  <br />
                  Deleting this habit will also remove it from all scheduled days.
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteHabit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Habit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
