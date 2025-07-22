import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WifiOff, Wifi, Download, Upload, Database } from "lucide-react";
import { toast } from "sonner";

interface SyncItem {
  id: string;
  type: 'habit' | 'task' | 'journal' | 'goal';
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
  synced: boolean;
  data: any;
}

export const OfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineStorage, setOfflineStorage] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored! Syncing data...");
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info("Working offline. Changes will sync when connected.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending sync items from localStorage
    loadPendingSync();
    calculateOfflineStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingSync = () => {
    try {
      const stored = localStorage.getItem('pendingSync');
      if (stored) {
        const items = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setPendingSync(items);
      }
    } catch (error) {
      console.error('Failed to load pending sync items:', error);
    }
  };

  const calculateOfflineStorage = () => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      setOfflineStorage(totalSize / 1024); // Convert to KB
    } catch (error) {
      console.error('Failed to calculate storage:', error);
    }
  };

  const syncData = async () => {
    if (!isOnline || isSyncing || pendingSync.length === 0) return;

    setIsSyncing(true);
    
    try {
      // Simulate syncing process
      for (let i = 0; i < pendingSync.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mark item as synced
        setPendingSync(prev => prev.map((item, index) => 
          index === i ? { ...item, synced: true } : item
        ));
      }

      // Clear synced items
      setTimeout(() => {
        setPendingSync(prev => prev.filter(item => !item.synced));
        localStorage.removeItem('pendingSync');
        toast.success("All data synced successfully!");
      }, 1000);

    } catch (error) {
      toast.error("Sync failed. Will retry automatically.");
    } finally {
      setIsSyncing(false);
    }
  };

  const addOfflineAction = (type: SyncItem['type'], action: SyncItem['action'], data: any) => {
    const newItem: SyncItem = {
      id: Date.now().toString(),
      type,
      action,
      timestamp: new Date(),
      synced: false,
      data
    };

    const updated = [...pendingSync, newItem];
    setPendingSync(updated);
    
    // Store in localStorage
    try {
      localStorage.setItem('pendingSync', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store offline action:', error);
    }
  };

  const clearOfflineData = () => {
    localStorage.clear();
    setPendingSync([]);
    setOfflineStorage(0);
    toast.success("Offline data cleared");
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'habit': return '🎯';
      case 'task': return '✅';
      case 'journal': return '📔';
      case 'goal': return '🌟';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-green-600';
      case 'update': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge 
                variant={isOnline ? "default" : "destructive"}
                className="mb-2"
              >
                {isOnline ? "Online" : "Offline"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {isOnline 
                  ? "All features available" 
                  : "Limited features. Data will sync when connected."
                }
              </p>
            </div>
            {!isOnline && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Sync */}
      {pendingSync.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Pending Sync ({pendingSync.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Syncing data...</span>
                    <span>{Math.round((pendingSync.filter(item => item.synced).length / pendingSync.length) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(pendingSync.filter(item => item.synced).length / pendingSync.length) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
              
              <div className="space-y-2 max-h-40 overflow-auto">
                {pendingSync.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                    <span className="text-lg">{getActionIcon(item.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{item.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.action}
                        </Badge>
                        {item.synced && (
                          <Badge variant="default" className="text-xs">
                            Synced
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {pendingSync.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingSync.length - 5} more items
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={syncData}
                  disabled={!isOnline || isSyncing}
                  size="sm"
                  className="flex-1"
                >
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Offline Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Used Storage</span>
              <span className="text-sm font-medium">
                {offlineStorage.toFixed(1)} KB
              </span>
            </div>
            
            <Progress value={(offlineStorage / 1024) * 100} className="h-2" />
            
            <div className="text-xs text-muted-foreground">
              <p>• Offline data is stored locally on your device</p>
              <p>• Data syncs automatically when online</p>
              <p>• Storage limit: 1 MB for optimal performance</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearOfflineData}
              className="w-full"
            >
              Clear Offline Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Offline Action */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Offline Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addOfflineAction('habit', 'create', { name: 'Test Habit' })}
            >
              Add Habit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addOfflineAction('task', 'update', { id: '123', completed: true })}
            >
              Update Task
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};