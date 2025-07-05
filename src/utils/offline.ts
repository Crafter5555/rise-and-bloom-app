
import { useState, useEffect } from 'react';

// Offline functionality utilities

export class OfflineManager {
  private isOnline = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];
  private pendingActions: Array<() => Promise<void>> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners(true);
    this.processPendingActions();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  private async processPendingActions() {
    const actions = [...this.pendingActions];
    this.pendingActions = [];

    for (const action of actions) {
      try {
        await action();
      } catch (error) {
        console.error('Failed to process pending action:', error);
        // Re-add failed actions to the queue
        this.pendingActions.push(action);
      }
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public addOnlineListener(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public addPendingAction(action: () => Promise<void>): void {
    this.pendingActions.push(action);
  }

  public async executeWhenOnline<T>(action: () => Promise<T>): Promise<T> {
    if (this.isOnline) {
      return await action();
    } else {
      return new Promise((resolve, reject) => {
        const pendingAction = async () => {
          try {
            const result = await action();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        this.addPendingAction(pendingAction);
      });
    }
  }
}

export const offlineManager = new OfflineManager();

// Hook for using offline status in components
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.getOnlineStatus());

  useEffect(() => {
    const unsubscribe = offlineManager.addOnlineListener(setIsOnline);
    return unsubscribe;
  }, []);

  return {
    isOnline,
    executeWhenOnline: offlineManager.executeWhenOnline.bind(offlineManager),
    addPendingAction: offlineManager.addPendingAction.bind(offlineManager),
  };
};
