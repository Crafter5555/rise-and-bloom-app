// Unified storage utility for web and mobile

import { useMobile } from "@/hooks/useMobile";

export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

class StorageManager {
  private mobile = useMobile();

  async setItem<T>(key: string, value: T, expiresInMs?: number): Promise<void> {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined,
    };

    const serialized = JSON.stringify(item);
    await this.mobile.storeData(key, serialized);
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const serialized = await this.mobile.getData(key);
      if (!serialized) return null;

      const item: StorageItem<T> = JSON.parse(serialized);
      
      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.mobile.removeData(key);
  }

  async clear(): Promise<void> {
    await this.mobile.clearAllData();
  }

  async getAllKeys(): Promise<string[]> {
    // This would need to be implemented based on the storage backend
    // For now, we'll return an empty array
    return [];
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.getItem<T>(key);
      })
    );

    return result;
  }

  async setMultiple<T>(items: Record<string, T>): Promise<void> {
    await Promise.all(
      Object.entries(items).map(([key, value]) => 
        this.setItem(key, value)
      )
    );
  }
}

export const storage = new StorageManager();

// Specific storage utilities for the app
export const userPreferences = {
  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    return (await storage.getItem<'light' | 'dark' | 'system'>('theme')) || 'system';
  },

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await storage.setItem('theme', theme);
  },

  async getNotificationSettings(): Promise<{
    morningReminder: boolean;
    eveningReminder: boolean;
    habitReminders: boolean;
  }> {
    return (await storage.getItem('notificationSettings')) || {
      morningReminder: true,
      eveningReminder: true,
      habitReminders: true,
    };
  },

  async setNotificationSettings(settings: {
    morningReminder: boolean;
    eveningReminder: boolean;
    habitReminders: boolean;
  }): Promise<void> {
    await storage.setItem('notificationSettings', settings);
  },
};

export const appData = {
  async getLastSync(): Promise<Date | null> {
    const timestamp = await storage.getItem<number>('lastSync');
    return timestamp ? new Date(timestamp) : null;
  },

  async setLastSync(date: Date): Promise<void> {
    await storage.setItem('lastSync', date.getTime());
  },

  async getOfflineData<T>(key: string): Promise<T | null> {
    return await storage.getItem<T>(`offline_${key}`);
  },

  async setOfflineData<T>(key: string, data: T): Promise<void> {
    await storage.setItem(`offline_${key}`, data);
  },
};