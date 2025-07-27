import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { useOfflineStatus } from "@/utils/offline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedSync } from "@/hooks/useEnhancedSync";
import { cn } from "@/lib/utils";

export const SyncStatus = () => {
  const { isOnline } = useOfflineStatus();
  const { user } = useAuth();
  const { 
    syncStatus, 
    pendingActionsCount, 
    lastSyncTime, 
    syncErrors, 
    retrySync 
  } = useEnhancedSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const formatSyncTime = (time: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return "1+ days ago";
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await retrySync();
    } catch (error) {
      console.error('Sync refresh failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return "text-red-600";
    if (syncStatus === 'syncing') return "text-blue-600";
    if (syncStatus === 'pending') return "text-yellow-600";
    if (syncErrors.length > 0) return "text-orange-600";
    return "text-green-600";
  };

  const getSyncStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === 'syncing') return "Syncing...";
    if (syncStatus === 'pending') return `${pendingActionsCount} pending`;
    if (syncErrors.length > 0) return "Sync errors";
    return lastSyncTime ? `Synced ${formatSyncTime(lastSyncTime)}` : "Synced";
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
          isOnline ? "hover:bg-green-50" : "bg-yellow-50 text-yellow-700",
          syncErrors.length > 0 && "bg-orange-50 text-orange-700"
        )}
        onClick={handleRefresh}
        title={syncErrors.length > 0 ? `Sync errors: ${syncErrors.join(', ')}` : undefined}
      >
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Cloud className="w-3 h-3" />
          ) : (
            <CloudOff className="w-3 h-3" />
          )}
          <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
          <span className={getSyncStatusColor()}>{getSyncStatusText()}</span>
        </div>
      </Badge>
    </div>
  );
};