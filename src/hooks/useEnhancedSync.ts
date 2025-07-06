
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineStatus } from '@/utils/offline';
import { useToast } from '@/hooks/use-toast';

interface PendingAction {
  id: string;
  type: 'habit_completion' | 'task_update' | 'daily_plan_update' | 'goal_update';
  table: 'habit_completions' | 'tasks' | 'daily_plans' | 'goals';
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export const useEnhancedSync = () => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing'>('synced');
  const { user } = useAuth();
  const { isOnline } = useOfflineStatus();
  const { toast } = useToast();

  // Load pending actions from storage
  const loadPendingActions = useCallback(async () => {
    try {
      const stored = localStorage.getItem('pendingActions');
      if (stored) {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
        if (actions.length > 0) {
          setSyncStatus('pending');
        }
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }, []);

  // Save pending actions to storage
  const savePendingActions = useCallback((actions: PendingAction[]) => {
    try {
      localStorage.setItem('pendingActions', JSON.stringify(actions));
      setSyncStatus(actions.length > 0 ? 'pending' : 'synced');
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }, []);

  // Add action to queue (optimistic update)
  const queueAction = useCallback((
    type: PendingAction['type'],
    table: PendingAction['table'],
    action: 'insert' | 'update' | 'delete',
    data: any
  ) => {
    const pendingAction: PendingAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      action,
      data: { ...data, user_id: user?.id },
      timestamp: Date.now()
    };

    const newActions = [...pendingActions, pendingAction];
    setPendingActions(newActions);
    savePendingActions(newActions);

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingActions();
    }

    return pendingAction.id;
  }, [pendingActions, savePendingActions, user?.id, isOnline]);

  // Execute pending actions
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || !user || pendingActions.length === 0) return;

    setSyncStatus('syncing');
    const failedActions: PendingAction[] = [];

    for (const action of pendingActions) {
      try {
        let result;
        
        switch (action.action) {
          case 'insert':
            result = await supabase
              .from(action.table)
              .insert(action.data);
            break;
          case 'update':
            const { id, ...updateData } = action.data;
            result = await supabase
              .from(action.table)
              .update(updateData)
              .eq('id', id);
            break;
          case 'delete':
            result = await supabase
              .from(action.table)
              .delete()
              .eq('id', action.data.id);
            break;
        }

        if (result?.error) {
          console.error(`Sync error for ${action.type}:`, result.error);
          failedActions.push(action);
        }
      } catch (error) {
        console.error(`Sync error for ${action.type}:`, error);
        failedActions.push(action);
      }
    }

    // Update pending actions with only failed ones
    setPendingActions(failedActions);
    savePendingActions(failedActions);

    if (failedActions.length === 0) {
      toast({
        title: "Synced",
        description: "All changes have been synced to the cloud"
      });
    } else if (failedActions.length < pendingActions.length) {
      toast({
        title: "Partially Synced",
        description: `${pendingActions.length - failedActions.length} changes synced, ${failedActions.length} pending`
      });
    }
  }, [isOnline, user, pendingActions, savePendingActions, toast]);

  // Helper functions for common actions
  const syncHabitCompletion = useCallback((habitId: string, completionDate: string) => {
    return queueAction('habit_completion', 'habit_completions', 'insert', {
      habit_id: habitId,
      completion_date: completionDate,
      completed_at: new Date().toISOString()
    });
  }, [queueAction]);

  const syncTaskUpdate = useCallback((taskId: string, updates: any) => {
    return queueAction('task_update', 'tasks', 'update', {
      id: taskId,
      ...updates,
      updated_at: new Date().toISOString()
    });
  }, [queueAction]);

  const syncDailyPlanUpdate = useCallback((planId: string, updates: any) => {
    return queueAction('daily_plan_update', 'daily_plans', 'update', {
      id: planId,
      ...updates,
      updated_at: new Date().toISOString()
    });
  }, [queueAction]);

  const syncGoalProgress = useCallback((goalId: string, progress: number) => {
    return queueAction('goal_update', 'goals', 'update', {
      id: goalId,
      progress,
      updated_at: new Date().toISOString()
    });
  }, [queueAction]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      const timeout = setTimeout(syncPendingActions, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, pendingActions.length, syncPendingActions]);

  // Load pending actions on mount
  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  return {
    syncStatus,
    pendingActionsCount: pendingActions.length,
    syncPendingActions,
    syncHabitCompletion,
    syncTaskUpdate,
    syncDailyPlanUpdate,
    syncGoalProgress,
    isOnline
  };
};
