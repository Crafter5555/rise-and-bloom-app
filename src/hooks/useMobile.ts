import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
// Removed Sentry import to fix build compatibility issue

// Error logging and crash reporting
class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: Array<{ error: Error; timestamp: number; context?: string }> = [];

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  logError(error: Error, context?: string) {
    const errorEntry = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error,
      timestamp: Date.now(),
      context
    };

    this.errors.push(errorEntry);
    console.error('App Error:', errorEntry);

    // In production, this would send to a crash reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToCrashReporting(errorEntry);
    }

    // Keep only last 50 errors to prevent memory issues
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  private async sendToCrashReporting(errorEntry: any) {
    try {
      // This would integrate with services like Sentry, Crashlytics, etc.
      // For now, we'll store in local storage for debugging
      const storedErrors = await this.getStoredErrors();
      storedErrors.push(errorEntry);
      
      // Keep only last 20 errors in storage
      const recentErrors = storedErrors.slice(-20);
      await Preferences.set({
        key: 'app_errors',
        value: JSON.stringify(recentErrors)
      });
    } catch (error) {
      console.error('Failed to log error to crash reporting:', error);
    }
  }

  async getStoredErrors() {
    try {
      const { value } = await Preferences.get({ key: 'app_errors' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Failed to get stored errors:', error);
      return [];
    }
  }

  getRecentErrors() {
    return this.errors.slice(-10);
  }
}

export const useMobile = () => {
  const [isNative, setIsNative] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const errorReporter = ErrorReporter.getInstance();

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    
    const initializeApp = async () => {
      try {
        if (isNativePlatform) {
          // Get app info and device info
          const [info, deviceInfo] = await Promise.all([
            App.getInfo(),
            Device.getInfo()
          ]);
          setAppVersion(info.version);
          setDeviceInfo(deviceInfo);

          // Set status bar style on native platforms
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#3b82f6' });

          // Handle app state changes
          App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active?', isActive);
            if (isActive) {
              // App came to foreground - good time to sync data
              window.dispatchEvent(new CustomEvent('app-foregrounded'));
            }
          });

          // Handle deep links
          App.addListener('appUrlOpen', (event) => {
            console.log('App opened with URL:', event.url);
            // Handle deep link navigation here
          });

          // Handle keyboard events
          Keyboard.addListener('keyboardWillShow', () => {
            setIsKeyboardOpen(true);
          });

          Keyboard.addListener('keyboardWillHide', () => {
            setIsKeyboardOpen(false);
          });

          // Request notification permissions on app start
          await requestNotificationPermissions();
        }

        // Global error handler
        window.addEventListener('error', (event) => {
          errorReporter.logError(event.error, 'Global error handler');
        });

        window.addEventListener('unhandledrejection', (event) => {
          errorReporter.logError(new Error(event.reason), 'Unhandled promise rejection');
        });

      } catch (error) {
        errorReporter.logError(error as Error, 'App initialization');
      }
    };

    initializeApp();

    return () => {
      if (isNativePlatform) {
        App.removeAllListeners();
        Keyboard.removeAllListeners();
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    if (!isNative) return false;

    try {
      const permission = await LocalNotifications.requestPermissions();
      console.log('Notification permission:', permission);
      return permission.display === 'granted';
    } catch (error) {
      errorReporter.logError(error as Error, 'Notification permissions');
      return false;
    }
  };

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) return;

    try {
      await Haptics.impact({ style });
    } catch (error) {
      errorReporter.logError(error as Error, 'Haptic feedback');
    }
  };

  const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) return;

    try {
      await Haptics.notification({ type });
    } catch (error) {
      errorReporter.logError(error as Error, 'Haptic notification');
    }
  };

  const scheduleNotification = async (
    title: string, 
    body: string, 
    schedule?: Date,
    id?: number
  ) => {
    if (!isNative) return null;

    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        const granted = await requestNotificationPermissions();
        if (!granted) return null;
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
      errorReporter.logError(error as Error, 'Schedule notification');
      return null;
    }
  };

  const cancelNotification = async (id: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error) {
      errorReporter.logError(error as Error, 'Cancel notification');
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
      errorReporter.logError(error as Error, `Store data: ${key}`);
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
      errorReporter.logError(error as Error, `Get data: ${key}`);
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
      errorReporter.logError(error as Error, `Remove data: ${key}`);
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
      errorReporter.logError(error as Error, 'Clear all data');
    }
  };

  const exitApp = () => {
    try {
      if (isNative) {
        App.exitApp();
      }
    } catch (error) {
      errorReporter.logError(error as Error, 'Exit app');
    }
  };

  const getAppInfo = () => ({
    version: appVersion,
    isNative,
    platform: Capacitor.getPlatform(),
    deviceInfo
  });

  const logError = (error: Error, context?: string) => {
    errorReporter.logError(error, context);
    // Note: Sentry integration temporarily disabled for mobile compatibility
  };

  const getRecentErrors = () => {
    return errorReporter.getRecentErrors();
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
    getAppInfo,
    logError,
    getRecentErrors,
  };
};
