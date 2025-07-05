import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";
import { ImpactStyle } from "@capacitor/haptics";
import { LoadingSpinner } from "./LoadingSpinner";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
}

export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  className,
  threshold = 80 
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const { hapticFeedback, isNative } = useMobile();

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isRefreshing || containerRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      if (distance >= threshold && !canRefresh) {
        setCanRefresh(true);
        if (isNative) {
          hapticFeedback(ImpactStyle.Medium);
        }
      } else if (distance < threshold && canRefresh) {
        setCanRefresh(false);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      if (isNative) {
        await hapticFeedback(ImpactStyle.Heavy);
      }
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canRefresh, isRefreshing]);

  const refreshIndicatorTransform = isRefreshing 
    ? `translateY(${threshold}px)` 
    : `translateY(${pullDistance}px)`;

  const refreshIndicatorOpacity = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ 
        transform: isRefreshing ? `translateY(${threshold}px)` : `translateY(${pullDistance}px)`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
      }}
    >
      {/* Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 z-10"
        style={{
          transform: `translateY(-${threshold}px)`,
          opacity: refreshIndicatorOpacity
        }}
      >
        <div className="flex items-center gap-2 text-primary">
          {isRefreshing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="text-sm font-medium">Refreshing...</span>
            </>
          ) : canRefresh ? (
            <span className="text-sm font-medium">Release to refresh</span>
          ) : (
            <span className="text-sm font-medium">Pull to refresh</span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};