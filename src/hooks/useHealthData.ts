import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useMobile } from './useMobile';

interface HealthMetrics {
  steps: number | null;
  heartRate: number | null;
  sleepHours: number | null;
  activeCalories: number | null;
  distance: number | null;
}

interface HealthPermissions {
  steps: boolean;
  heartRate: boolean;
  sleep: boolean;
  activity: boolean;
  location: boolean;
}

export const useHealthData = () => {
  const [healthData, setHealthData] = useState<HealthMetrics>({
    steps: null,
    heartRate: null,
    sleepHours: null,
    activeCalories: null,
    distance: null,
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
  const { isNative, logError } = useMobile();

  // Request health permissions
  const requestHealthPermissions = useCallback(async () => {
    if (!isNative) {
      setError('Health data only available on mobile devices');
      return false;
    }

    try {
      // For now, we'll simulate permission requests
      // In a real implementation, you would use @capacitor-community/health
      // or native health APIs through custom plugins
      
      const hasPermissions = await requestNativeHealthPermissions();
      
      setPermissions({
        steps: hasPermissions,
        heartRate: hasPermissions,
        sleep: hasPermissions,
        activity: hasPermissions,
        location: hasPermissions,
      });

      return hasPermissions;
    } catch (error) {
      const err = error as Error;
      logError(err, 'Health permissions request failed');
      setError('Failed to request health permissions');
      return false;
    }
  }, [isNative, logError]);

  // Simulate native health permission request
  const requestNativeHealthPermissions = async (): Promise<boolean> => {
    // This would be replaced with actual health plugin calls
    return new Promise((resolve) => {
      // Simulate permission dialog
      setTimeout(() => {
        // For demo purposes, assume permissions are granted
        resolve(true);
      }, 1000);
    });
  };

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    if (!isNative || !permissions.steps) {
      return;
    }

    setIsLoading(true);
    try {
      // This would be replaced with actual health data fetching
      const mockHealthData = await fetchMockHealthData();
      setHealthData(mockHealthData);
      setError(null);
    } catch (error) {
      const err = error as Error;
      logError(err, 'Health data fetch failed');
      setError('Failed to fetch health data');
    } finally {
      setIsLoading(false);
    }
  }, [isNative, permissions.steps, logError]);

  // Mock health data for demonstration
  const fetchMockHealthData = async (): Promise<HealthMetrics> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          steps: Math.floor(Math.random() * 10000) + 2000,
          heartRate: Math.floor(Math.random() * 40) + 60,
          sleepHours: Math.floor(Math.random() * 4) + 6,
          activeCalories: Math.floor(Math.random() * 500) + 200,
          distance: Math.floor(Math.random() * 5000) + 1000,
        });
      }, 500);
    });
  };

  // Initialize health data on mount
  useEffect(() => {
    const initHealthData = async () => {
      if (isNative) {
        const hasPermissions = await requestHealthPermissions();
        if (hasPermissions) {
          await fetchHealthData();
        }
      } else {
        setIsLoading(false);
      }
    };

    initHealthData();
  }, [isNative, requestHealthPermissions, fetchHealthData]);

  // Refresh health data periodically
  useEffect(() => {
    if (!isNative || !permissions.steps) return;

    const interval = setInterval(fetchHealthData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isNative, permissions.steps, fetchHealthData]);

  return {
    healthData,
    permissions,
    isLoading,
    error,
    requestHealthPermissions,
    refreshHealthData: fetchHealthData,
    isHealthAvailable: isNative,
  };
};