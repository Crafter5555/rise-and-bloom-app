import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Database, Signal, AlertTriangle } from "lucide-react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  target: number;
  description: string;
}

export const PerformanceOptimizer = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Simulate performance monitoring
    const measurePerformance = () => {
      const mockMetrics: PerformanceMetric[] = [
        {
          name: 'Page Load Time',
          value: 1.2,
          unit: 's',
          status: 'good',
          target: 2.0,
          description: 'Time to load the main content'
        },
        {
          name: 'Memory Usage',
          value: 45,
          unit: 'MB',
          status: 'good',
          target: 100,
          description: 'Current memory consumption'
        },
        {
          name: 'Cache Hit Rate',
          value: 87,
          unit: '%',
          status: 'warning',
          target: 95,
          description: 'Percentage of requests served from cache'
        },
        {
          name: 'API Response Time',
          value: 340,
          unit: 'ms',
          status: 'good',
          target: 500,
          description: 'Average API response time'
        },
        {
          name: 'Bundle Size',
          value: 2.8,
          unit: 'MB',
          status: 'warning',
          target: 2.0,
          description: 'Total JavaScript bundle size'
        }
      ];

      setMetrics(mockMetrics);
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return { variant: 'default' as const, label: 'Good' };
      case 'warning': return { variant: 'secondary' as const, label: 'Warning' };
      case 'poor': return { variant: 'destructive' as const, label: 'Poor' };
      default: return { variant: 'outline' as const, label: 'Unknown' };
    }
  };

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear cached data
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Clear localStorage items that might be large
    const keysToKeep = ['auth-token', 'user-preferences'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    setIsOptimizing(false);
    
    // Refresh metrics
    setTimeout(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value * 0.9, // Simulate improvement
        status: metric.status === 'poor' ? 'warning' : 
                metric.status === 'warning' ? 'good' : 'good'
      })));
    }, 1000);
  };

  const getPerformanceScore = () => {
    const scores = metrics.map(metric => {
      const percentage = Math.min(100, (metric.target / Math.max(metric.value, 0.1)) * 100);
      return metric.unit === '%' ? metric.value : percentage;
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="space-y-4">
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
              Overall app performance rating
            </p>
            <Button 
              onClick={optimizePerformance}
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Performance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="w-5 h-5 text-blue-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const badge = getStatusBadge(metric.status);
              const percentage = metric.unit === '%' ? metric.value : 
                Math.min(100, (metric.value / metric.target) * 100);
              
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
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-sm text-orange-800 mb-1">
                Reduce Bundle Size
              </h4>
              <p className="text-xs text-orange-700">
                Consider code splitting and lazy loading for non-critical components
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-1">
                Improve Cache Strategy
              </h4>
              <p className="text-xs text-blue-700">
                Implement service worker for better offline experience and caching
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-sm text-green-800 mb-1">
                Memory Management
              </h4>
              <p className="text-xs text-green-700">
                Clean up unused data and optimize component re-renders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};