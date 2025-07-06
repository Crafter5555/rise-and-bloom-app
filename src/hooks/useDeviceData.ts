
import { useState, useEffect } from 'react';
import { useMobile } from './useMobile';

export interface DeviceInsights {
  sleep: {
    quality: number | null;
    hours: string | null;
    source: 'device' | 'manual' | 'unavailable';
  };
  screenTime: {
    total: string | null;
    source: 'device' | 'estimated' | 'unavailable';
  };
  steps: {
    count: number | null;
    source: 'device' | 'manual' | 'unavailable';
  };
  mood: {
    value: string | null;
    source: 'quiz' | 'manual' | 'unavailable';
  };
  water: {
    cups: string | null;
    source: 'manual' | 'unavailable';
  };
  mindfulness: {
    minutes: string | null;
    source: 'manual' | 'timer' | 'unavailable';
  };
}

export const useDeviceData = () => {
  const [insights, setInsights] = useState<DeviceInsights>({
    sleep: { quality: null, hours: null, source: 'unavailable' },
    screenTime: { total: null, source: 'unavailable' },
    steps: { count: null, source: 'unavailable' },
    mood: { value: null, source: 'unavailable' },
    water: { cups: null, source: 'unavailable' },
    mindfulness: { minutes: null, source: 'unavailable' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isNative, getData, storeData } = useMobile();

  const getStoredData = async (key: string): Promise<string | null> => {
    try {
      return await getData(key);
    } catch (error) {
      console.error(`Error getting stored data for ${key}:`, error);
      return null;
    }
  };

  const storeInsightData = async (key: string, value: string) => {
    try {
      await storeData(key, value);
    } catch (error) {
      console.error(`Error storing data for ${key}:`, error);
    }
  };

  // Get device information and capabilities
  const checkDeviceCapabilities = async () => {
    try {
      // For web, we can detect some basic info
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      
      console.log('Platform detection:', { isIOS, isAndroid, isNative });
      
      return { 
        hasHealthKit: isIOS && isNative, 
        hasGoogleFit: isAndroid && isNative, 
        platform: isNative ? (isIOS ? 'ios' : isAndroid ? 'android' : 'unknown') : 'web' 
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return { hasHealthKit: false, hasGoogleFit: false, platform: 'web' };
    }
  };

  // Screen time estimation based on app usage (basic implementation)
  const estimateScreenTime = async (): Promise<{ total: string | null; source: 'estimated' | 'unavailable' }> => {
    try {
      const sessionStart = await getStoredData('sessionStart');
      
      if (sessionStart) {
        const start = new Date(sessionStart);
        const now = new Date();
        const sessionMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
        
        const storedTotal = await getStoredData('dailyScreenTime');
        const previousMinutes = storedTotal ? parseInt(storedTotal) : 0;
        const totalMinutes = previousMinutes + sessionMinutes;
        
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        await storeInsightData('dailyScreenTime', totalMinutes.toString());
        await storeInsightData('sessionStart', now.toISOString());
        
        return {
          total: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
          source: 'estimated'
        };
      }
      
      return { total: null, source: 'unavailable' };
    } catch (error) {
      console.error('Error estimating screen time:', error);
      return { total: null, source: 'unavailable' };
    }
  };

  // Step counter (web-based pedometer simulation)
  const getStepCount = async (): Promise<{ count: number | null; source: 'device' | 'unavailable' }> => {
    try {
      if (!isNative) {
        // For web, we can't access real step data
        return { count: null, source: 'unavailable' };
      }

      // On native platforms, this would integrate with HealthKit/Google Fit
      // For now, return stored manual data or unavailable
      const storedSteps = await getStoredData('dailySteps');
      if (storedSteps) {
        return { count: parseInt(storedSteps), source: 'device' };
      }
      
      return { count: null, source: 'unavailable' };
    } catch (error) {
      console.error('Error getting step count:', error);
      return { count: null, source: 'unavailable' };
    }
  };

  // Sleep data from manual entry or device
  const getSleepData = async (): Promise<{ quality: number | null; hours: string | null; source: 'device' | 'manual' | 'unavailable' }> => {
    try {
      const storedQuality = await getStoredData('sleepQuality');
      const storedHours = await getStoredData('sleepHours');
      
      if (storedQuality && storedHours) {
        return {
          quality: parseInt(storedQuality),
          hours: storedHours,
          source: 'manual'
        };
      }
      
      return { quality: null, hours: null, source: 'unavailable' };
    } catch (error) {
      console.error('Error getting sleep data:', error);
      return { quality: null, hours: null, source: 'unavailable' };
    }
  };

  // Load all device insights
  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const capabilities = await checkDeviceCapabilities();
      console.log('Device capabilities:', capabilities);

      // Initialize session tracking
      const sessionExists = await getStoredData('sessionStart');
      if (!sessionExists) {
        await storeInsightData('sessionStart', new Date().toISOString());
      }

      const [sleepData, screenTimeData, stepData] = await Promise.all([
        getSleepData(),
        estimateScreenTime(),
        getStepCount()
      ]);

      // Load manual entries
      const waterCups = await getStoredData('waterCups');
      const mindfulMinutes = await getStoredData('mindfulMinutes');
      const moodValue = await getStoredData('currentMood');

      setInsights({
        sleep: sleepData,
        screenTime: screenTimeData,
        steps: stepData,
        mood: { value: moodValue, source: moodValue ? 'manual' : 'unavailable' },
        water: { cups: waterCups, source: waterCups ? 'manual' : 'unavailable' },
        mindfulness: { minutes: mindfulMinutes, source: mindfulMinutes ? 'manual' : 'unavailable' }
      });
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual data setters
  const updateSleepData = async (quality: number, hours: string) => {
    await storeInsightData('sleepQuality', quality.toString());
    await storeInsightData('sleepHours', hours);
    await loadInsights();
  };

  const updateWaterIntake = async (cups: string) => {
    await storeInsightData('waterCups', cups);
    await loadInsights();
  };

  const updateMindfulness = async (minutes: string) => {
    await storeInsightData('mindfulMinutes', minutes);
    await loadInsights();
  };

  const updateMood = async (mood: string) => {
    await storeInsightData('currentMood', mood);
    await loadInsights();
  };

  useEffect(() => {
    loadInsights();
    
    // Refresh insights every 5 minutes
    const interval = setInterval(loadInsights, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isNative]);

  return {
    insights,
    isLoading,
    refreshInsights: loadInsights,
    updateSleepData,
    updateWaterIntake,
    updateMindfulness,
    updateMood
  };
};
