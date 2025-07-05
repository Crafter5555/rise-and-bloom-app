import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, CheckSquare, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isToday, isTomorrow } from "date-fns";
import { ScheduleButton } from "@/components/today/ScheduleButton";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

interface TasksListProps {
  onRefresh?: () => void;
  onScheduleTask?: (task: Task) => void;
}

export const TasksList = ({ onRefresh, onScheduleTask }: TasksListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [scheduledTasks, setScheduledTasks] = useState<Record<string, any[]>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

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

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            completed,
            completed_at: completed ? new Date().toISOString() : null
          } : task
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

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
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

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const isOverdue = (task: Task) => {
    return task.due_date && !task.completed && isAfter(new Date(), new Date(task.due_date));
  };

  const handleScheduled = () => {
    fetchTasks();
    onRefresh?.();
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return !task.completed;
      case 'completed': return task.completed;
      default: return true;
    }
  });

  useEffect(() => {
    fetchTasks();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending ({tasks.filter(t => !t.completed).length})
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No {filter === 'all' ? '' : filter} tasks found</p>
          <p className="text-sm">Create your first task to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const taskSchedules = scheduledTasks[task.id] || [];
            
            return (
              <Card key={task.id} className={`p-4 ${isOverdue(task) ? 'border-red-200 bg-red-50' : ''} ${task.completed ? 'opacity-75' : ''}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTaskComplete(task.id, !!checked)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {isOverdue(task) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
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
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{getDueDateDisplay(task.due_date)}</span>
                        </div>
                      )}
                      <span>Created {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                      {task.completed_at && (
                        <span>Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
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
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
