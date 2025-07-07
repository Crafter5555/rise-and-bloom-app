
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Edit2, Trash2, Activity, Clock, Calendar } from "lucide-react";
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

interface ActivityItem {
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
  onScheduleActivity?: (activity: ActivityItem) => void;
}

export const ActivitiesList = ({ onRefresh, onScheduleActivity }: ActivitiesListProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [scheduledActivities, setScheduledActivities] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ activity: ActivityItem; scheduledDates: string[] } | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchActivities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
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

  const fetchScheduledActivities = async (activityList: ActivityItem[]) => {
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

  const handleEdit = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setShowEditDialog(true);
  };

  const handleActivityUpdated = () => {
    fetchActivities();
    onRefresh?.();
    setShowEditDialog(false);
    setEditingActivity(null);
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

  const handleDeleteActivity = (activity: ActivityItem) => {
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
    const colors = {
      fitness: 'bg-orange-100 text-orange-800 border-orange-200',
      learning: 'bg-blue-100 text-blue-800 border-blue-200',
      productivity: 'bg-green-100 text-green-800 border-green-200',
      wellness: 'bg-purple-100 text-purple-800 border-purple-200',
      social: 'bg-pink-100 text-pink-800 border-pink-200',
      creative: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const handleScheduled = () => {
    fetchActivities();
    onRefresh?.();
  };

  const categories = ['all', 'fitness', 'learning', 'productivity', 'wellness', 'social', 'creative', 'general'];
  
  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.category === filter
  );

  useEffect(() => {
    fetchActivities();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading activities...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={filter === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(category)}
              className="capitalize"
            >
              {category} 
              {category !== 'all' && (
                <span className="ml-1">
                  ({activities.filter(a => a.category === category).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No {filter === 'all' ? '' : filter} activities found</p>
            <p className="text-sm">Create your first activity to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
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
                        {activity.is_favorite && (
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
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
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{activity.duration_minutes} minutes</span>
                        </div>
                        <span>Created {format(new Date(activity.created_at), 'MMM d, yyyy')}</span>
                      </div>
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
                        className={`${activity.is_favorite ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                        onClick={() => toggleFavorite(activity.id, !activity.is_favorite)}
                      >
                        <Heart className={`w-4 h-4 ${activity.is_favorite ? 'fill-current' : ''}`} />
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
        )}
      </div>

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
