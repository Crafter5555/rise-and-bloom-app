import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';

export const useMobile = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (Capacitor.isNativePlatform()) {
      // Set status bar style on native platforms
      StatusBar.setStyle({ style: Style.Default });
    }
  }, []);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      await Haptics.impact({ style });
    }
  };

  const scheduleNotification = async (title: string, body: string, schedule?: Date) => {
    if (!isNative) return;

    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: schedule ? { at: schedule } : undefined,
            }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const storeData = async (key: string, value: string) => {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  };

  const getData = async (key: string): Promise<string | null> => {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  };

  return {
    isNative,
    hapticFeedback,
    scheduleNotification,
    storeData,
    getData,
  };
};