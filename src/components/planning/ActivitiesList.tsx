
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash2, Heart, HeartOff, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScheduleButton } from "@/components/today/ScheduleButton";
import { EditActivityDialog } from "@/components/dialogs/EditActivityDialog";
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

interface Activity {
  id: string;
  name: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  is_favorite: boolean;
  created_at: string;
}

interface ActivitiesListProps {
  onRefresh?: () => void;
  onScheduleActivity?: (activity: Activity) => void;
}

export const ActivitiesList = ({ onRefresh, onScheduleActivity }: ActivitiesListProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledActivities, setScheduledActivities] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<{ activity: Activity; scheduledDates: string[] } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchActivities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
      
      // Fetch scheduled activities
      await fetchScheduledActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledActivities = async (activityList: Activity[]) => {
    if (!user || activityList.length === 0) return;
    
    try {
      const activityIds = activityList.map(activity => activity.id);
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'activity')
        .in('item_id', activityIds);

      if (error) throw error;
      
      const scheduledByActivity = data?.reduce((acc, plan) => {
        if (!acc[plan.item_id]) acc[plan.item_id] = [];
        acc[plan.item_id].push(plan);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      setScheduledActivities(scheduledByActivity);
    } catch (error) {
      console.error('Error fetching scheduled activities:', error);
    }
  };

  const toggleFavorite = async (activityId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ is_favorite: isFavorite })
        .eq('id', activityId);

      if (error) throw error;

      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? { ...activity, is_favorite: isFavorite } : activity
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setEditDialogOpen(true);
  };

  const handleActivityUpdated = () => {
    fetchActivities();
    onRefresh?.();
    setEditDialogOpen(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activity: Activity) => {
    const scheduledDates = scheduledActivities[activity.id]?.map(plan => 
      format(new Date(plan.plan_date), 'MMM d, yyyy')
    ) || [];
    
    setActivityToDelete({ activity, scheduledDates });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      // Delete the activity - triggers will automatically clean up daily_plans
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDelete.activity.id);

      if (error) throw error;

      setActivities(prev => prev.filter(activity => activity.id !== activityToDelete.activity.id));
      setScheduledActivities(prev => {
        const updated = { ...prev };
        delete updated[activityToDelete.activity.id];
        return updated;
      });
      
      onRefresh?.();

      toast({
        title: "Success",
        description: activityToDelete.scheduledDates.length > 0 
          ? `Activity deleted and removed from ${activityToDelete.scheduledDates.length} scheduled day(s)`
          : "Activity deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-green-100 text-green-800 border-green-200';
      case 'learning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creative': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'work': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleScheduled = () => {
    fetchActivities();
    onRefresh?.();
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading activities...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activities created yet</p>
        <p className="text-sm">Create your first activity to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {activities.map((activity) => {
          const activitySchedules = scheduledActivities[activity.id] || [];
          
          return (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-foreground">{activity.name}</h4>
                    <Badge className={getCategoryColor(activity.category)}>
                      {activity.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{activity.duration_minutes}m</span>
                    </div>
                    {activity.is_favorite && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        Favorite
                      </Badge>
                    )}
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                  )}
                  
                  {/* Scheduled instances */}
                  {activitySchedules.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-2">Scheduled for:</div>
                      <div className="flex flex-wrap gap-2">
                        {activitySchedules.map((schedule) => (
                          <div key={schedule.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(schedule.plan_date), 'MMM d')}
                              {schedule.scheduled_time && ` at ${schedule.scheduled_time}`}
                            </Badge>
                            <ScheduleButton
                              item={{ ...activity, type: 'activity' }}
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
                  
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(activity.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <ScheduleButton
                    item={{ ...activity, type: 'activity' }}
                    onScheduled={handleScheduled}
                    variant="outline"
                    size="sm"
                    className="text-primary"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${activity.is_favorite ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground hover:text-red-600'}`}
                    onClick={() => toggleFavorite(activity.id, !activity.is_favorite)}
                  >
                    {activity.is_favorite ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(activity)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteActivity(activity)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <EditActivityDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        activity={editingActivity}
        onActivityUpdated={handleActivityUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{activityToDelete?.activity.name}"?
              {activityToDelete?.scheduledDates && activityToDelete.scheduledDates.length > 0 && (
                <>
                  <br /><br />
                  <strong>This activity is scheduled for:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {activityToDelete.scheduledDates.map((date, index) => (
                      <li key={index}>{date}</li>
                    ))}
                  </ul>
                  <br />
                  Deleting this activity will also remove it from all scheduled days.
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteActivity} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
