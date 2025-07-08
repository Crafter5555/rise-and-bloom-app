import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { useOfflineStatus } from "@/utils/offline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export const SyncStatus = () => {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useOfflineStatus();
  const { user } = useAuth();

  const updateSyncTime = () => {
    setLastSyncTime(new Date());
  };

  const formatSyncTime = (time: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return "1+ days ago";
  };

  // Listen for Supabase real-time events to update sync status
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sync-status')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        filter: `user_id=eq.${user.id}`
      }, () => {
        updateSyncTime();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update sync time on initial load and when coming online
  useEffect(() => {
    if (isOnline && user) {
      updateSyncTime();
    }
  }, [isOnline, user]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    // Trigger a small data fetch to update sync time
    try {
      await supabase
        .from('daily_plans')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);
      updateSyncTime();
    } catch (error) {
      console.error('Sync refresh failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-600" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-600" />
        )}
      </div>
      
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs px-2 py-0 cursor-pointer transition-colors",
          isOnline ? "hover:bg-green-50" : "bg-yellow-50 text-yellow-700"
        )}
        onClick={handleRefresh}
      >
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Cloud className="w-3 h-3" />
          ) : (
            <CloudOff className="w-3 h-3" />
          )}
          <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
          {lastSyncTime ? (
            <span>Synced {formatSyncTime(lastSyncTime)}</span>
          ) : (
            <span>{isOnline ? "Syncing..." : "Offline"}</span>
          )}
        </div>
      </Badge>
    </div>
  );
};