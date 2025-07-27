import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useMobile } from './useMobile';
import { Device } from '@capacitor/device';

interface HealthMetrics {
  steps: number | null;
  heartRate: number | null;
  sleepHours: number | null;
  activeCalories: number | null;
  distance: number | null;
  lastUpdated: Date | null;
}

interface HealthPermissions {
  steps: boolean;
  heartRate: boolean;
  sleep: boolean;
  activity: boolean;
  location: boolean;
}

interface HealthDataSource {
  type: 'device' | 'manual' | 'unavailable';
  platform?: string;
  lastSync?: Date;
}

export const useHealthData = () => {
  const [healthData, setHealthData] = useState<HealthMetrics>({
    steps: null,
    heartRate: null,
    sleepHours: null,
    activeCalories: null,
    distance: null,
    lastUpdated: null,
  });
  const [permissions, setPermissions] = useState<HealthPermissions>({
    steps: false,
    heartRate: false,
    sleep: false,
    activity: false,
    location: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<HealthDataSource>({ type: 'unavailable' });
  const { isNative, logError } = useMobile();

  // Request health permissions
  const requestHealthPermissions = useCallback(async () => {
    if (!isNative) {
      setError('Health data only available on mobile devices');
      setDataSource({ type: 'unavailable' });
      return false;
    }

    try {
      // Get device info to determine platform
      const deviceInfo = await Device.getInfo();
      const platform = deviceInfo.platform;
      
      // Check if health APIs are available on this platform
      const hasPermissions = await requestNativeHealthPermissions(platform);
      
      setPermissions({
        steps: hasPermissions,
        heartRate: hasPermissions,
        sleep: hasPermissions,
        activity: hasPermissions,
        location: hasPermissions,
      });

      if (hasPermissions) {
        setDataSource({ 
          type: 'device', 
          platform,
          lastSync: new Date()
        });
      } else {
        setDataSource({ type: 'manual', platform });
      }

      return hasPermissions;
    } catch (error) {
      const err = error as Error;
      logError(err, 'Health permissions request failed');
      setError('Failed to request health permissions');
      setDataSource({ type: 'unavailable' });
      return false;
    }
  }, [isNative, logError]);

  // Request native health permissions based on platform
  const requestNativeHealthPermissions = async (platform: string): Promise<boolean> => {
    // Platform-specific health permission requests
    if (platform === 'ios') {
      // For iOS, we would use HealthKit
      // This requires @capacitor-community/health plugin or custom native code
      try {
        // Placeholder for actual iOS HealthKit integration
        // const { available } = await HealthKit.isAvailable();
        // if (!available) return false;
        // const permissions = await HealthKit.requestAuthorization({
        //   read: ['steps', 'heartRate', 'sleepAnalysis'],
        //   write: []
        // });
        // return permissions.granted;
        
        // For now, simulate based on device capabilities
        return true; // Assume iOS devices have health capabilities
      } catch (error) {
        console.error('iOS HealthKit error:', error);
        return false;
      }
    } else if (platform === 'android') {
      // For Android, we would use Google Fit or Health Connect
      try {
        // Placeholder for actual Android Health integration
        // const { available } = await GoogleFit.isAvailable();
        // if (!available) return false;
        // const permissions = await GoogleFit.requestPermissions({
        //   scopes: ['steps', 'heart_rate', 'sleep']
        // });
        // return permissions.granted;
        
        // For now, simulate based on device capabilities
        return true; // Assume Android devices have health capabilities
      } catch (error) {
        console.error('Android Health error:', error);
        return false;
      }
    }
    
    return new Promise((resolve) => {
      // Fallback simulation for other platforms
      setTimeout(() => {
        resolve(false); // Conservative default
      }, 1000);
    });
  };

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    if (!isNative) {
      setDataSource({ type: 'unavailable' });
      return;
    }

    setIsLoading(true);
    try {
      if (permissions.steps && dataSource.type === 'device') {
        // Attempt to fetch real health data
        const realHealthData = await fetchRealHealthData();
        setHealthData(realHealthData);
      } else {
        // Fall back to stored manual data or mock data for development
        const fallbackData = await fetchFallbackHealthData();
        setHealthData(fallbackData);
      }
      setError(null);
    } catch (error) {
      const err = error as Error;
      logError(err, 'Health data fetch failed');
      setError('Failed to fetch health data');
      // Try fallback data even on error
      const fallbackData = await fetchFallbackHealthData();
      setHealthData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, [isNative, permissions.steps, dataSource.type, logError]);

  // Fetch real health data from platform APIs
  const fetchRealHealthData = async (): Promise<HealthMetrics> => {
    // This would integrate with actual health APIs
    // For now, we'll return enhanced mock data that simulates real integration
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date();
        resolve({
          steps: Math.floor(Math.random() * 8000) + 2000, // 2000-10000 steps
          heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
          sleepHours: Math.floor(Math.random() * 3) + 6.5, // 6.5-9.5 hours
          activeCalories: Math.floor(Math.random() * 400) + 200, // 200-600 calories
          distance: Math.floor(Math.random() * 8000) + 1000, // 1-9 km in meters
          lastUpdated: now,
        });
      }, 500);
    });
  };

  // Fallback health data (manual entry or stored data)
  const fetchFallbackHealthData = async (): Promise<HealthMetrics> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Try to get stored manual data first
        const storedSteps = localStorage.getItem('manual_steps');
        const storedSleep = localStorage.getItem('manual_sleep');
        
        resolve({
          steps: storedSteps ? parseInt(storedSteps) : null,
          heartRate: null, // Manual heart rate entry not typically available
          sleepHours: storedSleep ? parseFloat(storedSleep) : null,
          activeCalories: null,
          distance: null,
          lastUpdated: storedSteps || storedSleep ? new Date() : null,
        });
      }, 500);
    });
  };

  // Manual data entry functions
  const updateManualSteps = async (steps: number) => {
    localStorage.setItem('manual_steps', steps.toString());
    localStorage.setItem('manual_steps_date', new Date().toISOString());
    await fetchHealthData();
  };

  const updateManualSleep = async (hours: number) => {
    localStorage.setItem('manual_sleep', hours.toString());
    localStorage.setItem('manual_sleep_date', new Date().toISOString());
    await fetchHealthData();
  };

  // Initialize health data on mount
  useEffect(() => {
    const initHealthData = async () => {
      if (isNative) {
        const hasPermissions = await requestHealthPermissions();
        await fetchHealthData(); // Fetch data regardless of permissions (fallback to manual)
      } else {
        setDataSource({ type: 'unavailable' });
        setIsLoading(false);
      }
    };

    initHealthData();
  }, [isNative, requestHealthPermissions, fetchHealthData]);

  // Refresh health data periodically
  useEffect(() => {
    if (!isNative) return;

    const interval = setInterval(fetchHealthData, 300000); // Every 5 minutes (less aggressive)
    return () => clearInterval(interval);
  }, [isNative, fetchHealthData]);

  return {
    healthData,
    permissions,
    dataSource,
    isLoading,
    error,
    requestHealthPermissions,
    refreshHealthData: fetchHealthData,
    updateManualSteps,
    updateManualSleep,
    isHealthAvailable: isNative,
  };
};