import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Clock, Database, Signal, AlertTriangle, TrendingUp } from "lucide-react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'poor';
  target: number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const AppPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimized, setLastOptimized] = useState<Date | null>(null);

  useEffect(() => {
    measurePerformance();
    const interval = setInterval(measurePerformance, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const measurePerformance = () => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // Get memory info if available
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }

      // Calculate FPS (approximate)
      let fps = 60; // Default assumption
      if ('requestAnimationFrame' in window) {
        let lastTime = performance.now();
        let frameCount = 0;
        const measureFPS = () => {
          frameCount++;
          const currentTime = performance.now();
          if (currentTime - lastTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
          }
          if (frameCount < 60) requestAnimationFrame(measureFPS);
        };
        requestAnimationFrame(measureFPS);
      }

      // Get bundle size estimate
      const bundleSize = document.querySelectorAll('script[src]').length * 0.5; // Rough estimate

      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Page Load Time',
          value: Math.round(loadTime),
          unit: 'ms',
          status: loadTime < 2000 ? 'excellent' : loadTime < 3000 ? 'good' : loadTime < 5000 ? 'warning' : 'poor',
          target: 2000,
          description: 'Time to fully load the application',
          trend: 'stable'
        },
        {
          name: 'Memory Usage',
          value: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
          unit: 'MB',
          status: memory ? 
            (memory.usedJSHeapSize < 50 * 1024 * 1024 ? 'excellent' : 
             memory.usedJSHeapSize < 100 * 1024 * 1024 ? 'good' : 
             memory.usedJSHeapSize < 200 * 1024 * 1024 ? 'warning' : 'poor') : 'good',
          target: 100,
          description: 'Current JavaScript heap memory usage',
          trend: 'stable'
        },
        {
          name: 'Frame Rate',
          value: fps,
          unit: 'fps',
          status: fps >= 55 ? 'excellent' : fps >= 45 ? 'good' : fps >= 30 ? 'warning' : 'poor',
          target: 60,
          description: 'Animation smoothness and responsiveness',
          trend: 'stable'
        },
        {
          name: 'Bundle Efficiency',
          value: bundleSize,
          unit: 'MB',
          status: bundleSize < 2 ? 'excellent' : bundleSize < 3 ? 'good' : bundleSize < 5 ? 'warning' : 'poor',
          target: 2,
          description: 'Estimated JavaScript bundle size',
          trend: 'stable'
        }
      ];

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error measuring performance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return { variant: 'default' as const, label: 'Excellent' };
      case 'good': return { variant: 'secondary' as const, label: 'Good' };
      case 'warning': return { variant: 'destructive' as const, label: 'Warning' };
      case 'poor': return { variant: 'destructive' as const, label: 'Poor' };
      default: return { variant: 'outline' as const, label: 'Unknown' };
    }
  };

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear large localStorage items (keep essential data)
      const keysToKeep = ['auth-token', 'user-preferences', 'supabase.auth.token'];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          try {
            const item = localStorage.getItem(key);
            if (item && item.length > 10000) { // Remove large items
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Ignore errors
          }
        }
      });
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      setLastOptimized(new Date());
      
      // Re-measure performance after optimization
      setTimeout(() => {
        measurePerformance();
      }, 1000);
      
    } catch (error) {
      console.error('Error during optimization:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getPerformanceScore = () => {
    if (metrics.length === 0) return 0;
    
    const scores = metrics.map(metric => {
      switch (metric.status) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'warning': return 60;
        case 'poor': return 40;
        default: return 70;
      }
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {getPerformanceScore()}
            </div>
            <Progress value={getPerformanceScore()} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Overall application performance rating
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={optimizePerformance}
                disabled={isOptimizing}
                className="flex-1"
              >
                {isOptimizing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Optimize Now
                  </>
                )}
              </Button>
            </div>
            
            {lastOptimized && (
              <p className="text-xs text-muted-foreground">
                Last optimized: {lastOptimized.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Memory Information */}
      {memoryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Used Memory</span>
                <span className="font-medium">{formatBytes(memoryInfo.usedJSHeapSize)}</span>
              </div>
              <Progress 
                value={(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                Limit: {formatBytes(memoryInfo.jsHeapSizeLimit)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="w-5 h-5 text-green-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const badge = getStatusBadge(metric.status);
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{metric.name}</span>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.value}{metric.unit}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Target: {metric.target}{metric.unit}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.some(m => m.status === 'warning' || m.status === 'poor') ? (
              <>
                {metrics.find(m => m.name === 'Memory Usage' && (m.status === 'warning' || m.status === 'poor')) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High memory usage detected. Consider closing other browser tabs or restarting the app.
                    </AlertDescription>
                  </Alert>
                )}
                
                {metrics.find(m => m.name === 'Page Load Time' && (m.status === 'warning' || m.status === 'poor')) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Slow loading detected. Check your internet connection or try the optimization button above.
                    </AlertDescription>
                  </Alert>
                )}
                
                {metrics.find(m => m.name === 'Frame Rate' && (m.status === 'warning' || m.status === 'poor')) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Low frame rate detected. Close other applications or reduce browser tabs for smoother performance.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  🎉 Great performance! Your app is running smoothly with optimal metrics.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};