import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export const useMobile = () => {
  const [isNative, setIsNative] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    
    if (isNativePlatform) {
      // Set status bar style on native platforms
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#3b82f6' });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle deep links
      App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event.url);
      });

      // Handle keyboard events
      Keyboard.addListener('keyboardWillShow', () => {
        setIsKeyboardOpen(true);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        setIsKeyboardOpen(false);
      });

      // Request notification permissions on app start
      requestNotificationPermissions();
    }

    return () => {
      if (isNativePlatform) {
        App.removeAllListeners();
        Keyboard.removeAllListeners();
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    if (!isNative) return;

    try {
      const permission = await LocalNotifications.requestPermissions();
      console.log('Notification permission:', permission);
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
    }
  };

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptic feedback failed:', error);
      }
    }
  };

  const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
    if (isNative) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.error('Haptic notification failed:', error);
      }
    }
  };

  const scheduleNotification = async (
    title: string, 
    body: string, 
    schedule?: Date,
    id?: number
  ) => {
    if (!isNative) return;

    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        await requestNotificationPermissions();
      }

      const notificationId = id || Date.now();
      const options: ScheduleOptions = {
        notifications: [
          {
            title,
            body,
            id: notificationId,
            schedule: schedule ? { at: schedule } : undefined,
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      };

      await LocalNotifications.schedule(options);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  };

  const cancelNotification = async (id: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: id.toString() }] });
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const storeData = async (key: string, value: string) => {
    try {
      if (isNative) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  };

  const getData = async (key: string): Promise<string | null> => {
    try {
      if (isNative) {
        const { value } = await Preferences.get({ key });
        return value;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Failed to get data:', error);
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      if (isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  };

  const clearAllData = async () => {
    try {
      if (isNative) {
        await Preferences.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const exitApp = () => {
    if (isNative) {
      App.exitApp();
    }
  };

  return {
    isNative,
    isKeyboardOpen,
    hapticFeedback,
    hapticNotification,
    scheduleNotification,
    cancelNotification,
    storeData,
    getData,
    removeData,
    clearAllData,
    exitApp,
    requestNotificationPermissions,
  };
};
