import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory?: number;
  timing?: PerformanceTiming;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  sampleInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const usePerformanceMonitor = ({
  enabled = true,
  sampleInterval = 1000,
  onMetricsUpdate,
}: PerformanceMonitorOptions = {}) => {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  const measureFPS = useCallback(() => {
    frameCountRef.current++;

    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= sampleInterval) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);

      const metrics: PerformanceMetrics = {
        fps,
        memory: (performance as any).memory?.usedJSHeapSize,
        timing: performance.timing,
      };

      onMetricsUpdate?.(metrics);

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }
  }, [enabled, sampleInterval, onMetricsUpdate]);

  useEffect(() => {
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, measureFPS]);

  const getNavigationTiming = useCallback(() => {
    const timing = performance.timing;
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint').find((entry) => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint').find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
    };
  }, []);

  const getResourceMetrics = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      transferSize: resource.transferSize,
      type: resource.initiatorType,
    }));
  }, []);

  const clearMetrics = useCallback(() => {
    performance.clearMarks();
    performance.clearMeasures();
    performance.clearResourceTimings();
  }, []);

  return {
    getNavigationTiming,
    getResourceMetrics,
    clearMetrics,
  };
};
