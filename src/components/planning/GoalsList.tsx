import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit2, Trash2, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EditGoalDialog } from "@/components/dialogs/EditGoalDialog";
import { format, isAfter } from "date-fns";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  period_type: string;
  target_date: string | null;
  target_value: number;
  progress: number;
  status: string;
  created_at: string;
}

interface GoalsListProps {
  onRefresh?: () => void;
}

export const GoalsList = ({ onRefresh }: GoalsListProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowEditDialog(true);
  };

  const handleGoalUpdated = () => {
    fetchGoals();
    onRefresh?.();
    setShowEditDialog(false);
    setEditingGoal(null);
  };

  const updateGoalStatus = async (goalId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => 
        prev.map(goal => 
          goal.id === goalId ? { ...goal, status } : goal
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive"
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Goal deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isOverdue = (goal: Goal) => {
    return goal.target_date && goal.status === 'active' && isAfter(new Date(), new Date(goal.target_date));
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading goals...</div>;
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No goals created yet</p>
        <p className="text-sm">Set your first goal to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {goals.map((goal) => (
        <Card key={goal.id} className={`p-4 ${isOverdue(goal) ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-foreground">{goal.title}</h4>
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {goal.period_type}
                </Badge>
                {isOverdue(goal) && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
              
              {goal.description && (
                <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}% / {goal.target_value}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {goal.target_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <span>Created {format(new Date(goal.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              {goal.status === 'active' && (
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateGoalStatus(goal.id, 'completed')}
                  >
                    Mark Complete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateGoalStatus(goal.id, 'paused')}
                  >
                    Pause
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleEdit(goal)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </Card>
        ))}
      </div>

      <EditGoalDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        goal={editingGoal}
        onGoalUpdated={handleGoalUpdated}
      />
    </>
  );
};