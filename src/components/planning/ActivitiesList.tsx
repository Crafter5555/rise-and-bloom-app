import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Edit2, Trash2, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
}

export const ActivitiesList = ({ onRefresh }: ActivitiesListProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
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

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      onRefresh?.();

      toast({
        title: "Success",
        description: "Activity deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive"
      });
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
          {filteredActivities.map((activity) => (
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
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{activity.duration_minutes} minutes</span>
                    </div>
                    <span>Created {format(new Date(activity.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`${activity.is_favorite ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                    onClick={() => toggleFavorite(activity.id, !activity.is_favorite)}
                  >
                    <Heart className={`w-4 h-4 ${activity.is_favorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteActivity(activity.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};