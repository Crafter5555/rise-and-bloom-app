
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Edit2, Trash2, Calendar, Clock } from "lucide-react";
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

interface TasksListProps {
  onRefresh?: () => void;
  onScheduleTask?: (task: Task) => void;
}

export const TasksList = ({ onRefresh, onScheduleTask }: TasksListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledTasks, setScheduledTasks] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ task: Task; scheduledDates: string[] } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
      
      // Fetch scheduled tasks
      await fetchScheduledTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledTasks = async (taskList: Task[]) => {
    if (!user || taskList.length === 0) return;
    
    try {
      const taskIds = taskList.map(task => task.id);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'task')
        .in('item_id', taskIds);

      if (error) throw error;
      
      const scheduledByTask = data?.reduce((acc, plan) => {
        if (!acc[plan.item_id]) acc[plan.item_id] = [];
        acc[plan.item_id].push(plan);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      setScheduledTasks(scheduledByTask);
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
    }
  };

  const handleDeleteTask = (task: Task) => {
    const scheduledDates = scheduledTasks[task.id]?.map(plan => 
      format(new Date(plan.plan_date), 'MMM d, yyyy')
    ) || [];
    
    setTaskToDelete({ task, scheduledDates });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      // Delete the task - triggers will automatically clean up daily_plans
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.task.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskToDelete.task.id));
      setScheduledTasks(prev => {
        const updated = { ...prev };
        delete updated[taskToDelete.task.id];
        return updated;
      });
      
      onRefresh?.();

      toast({
        title: "Success",
        description: taskToDelete.scheduledDates.length > 0 
          ? `Task deleted and removed from ${taskToDelete.scheduledDates.length} scheduled day(s)`
          : "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const toggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleScheduled = () => {
    fetchTasks();
    onRefresh?.();
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No tasks created yet</p>
        <p className="text-sm">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => {
          const taskSchedules = scheduledTasks[task.id] || [];
          
          return (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-5 h-5 rounded-full p-0 border-2 mt-1 ${
                      task.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted hover:border-primary"
                    }`}
                    onClick={() => toggleComplete(task.id, !task.completed)}
                  >
                    {task.completed && <CheckCircle2 className="w-3 h-3" />}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}
                    
                    {/* Scheduled instances */}
                    {taskSchedules.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-2">Scheduled for:</div>
                        <div className="flex flex-wrap gap-2">
                          {taskSchedules.map((schedule) => (
                            <div key={schedule.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(schedule.plan_date), 'MMM d')}
                                {schedule.scheduled_time && ` at ${schedule.scheduled_time}`}
                              </Badge>
                              <ScheduleButton
                                item={{ ...task, type: 'task' }}
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
                  
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                      )}
                      <span>Created {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <ScheduleButton
                    item={{ ...task, type: 'task' }}
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
                    onClick={() => handleDeleteTask(task)}
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
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.task.title}"?
              {taskToDelete?.scheduledDates && taskToDelete.scheduledDates.length > 0 && (
                <>
                  <br /><br />
                  <strong>This task is scheduled for:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {taskToDelete.scheduledDates.map((date, index) => (
                      <li key={index}>{date}</li>
                    ))}
                  </ul>
                  <br />
                  Deleting this task will also remove it from all scheduled days.
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
