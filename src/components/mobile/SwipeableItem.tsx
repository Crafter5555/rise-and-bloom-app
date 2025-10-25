import { useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { ImpactStyle } from '@capacitor/haptics';

interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: 'destructive' | 'primary' | 'success' | 'warning';
  onAction: () => void;
}

interface SwipeableItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
}

export const SwipeableItem = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className
}: SwipeableItemProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const { hapticFeedback } = useMobile();

  const colorClasses = {
    destructive: 'bg-destructive text-destructive-foreground',
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    if ((diff > 0 && leftActions.length > 0) || (diff < 0 && rightActions.length > 0)) {
      const maxSwipe = diff > 0 ? leftActions.length * 80 : rightActions.length * -80;
      setOffsetX(Math.max(Math.min(diff, leftActions.length * 80), rightActions.length * -80));
    }
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);

    const absOffset = Math.abs(offsetX);

    if (absOffset >= threshold) {
      await hapticFeedback(ImpactStyle.Medium);

      const actions = offsetX > 0 ? leftActions : rightActions;
      const actionIndex = Math.min(
        Math.floor(absOffset / 80),
        actions.length - 1
      );

      if (actions[actionIndex]) {
        actions[actionIndex].onAction();
      }
    }

    setOffsetX(0);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center w-20 transition-opacity',
                colorClasses[action.color],
                offsetX > index * 80 ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="flex flex-col items-center gap-1 text-xs font-medium">
                {action.icon}
                <span>{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex flex-row-reverse">
          {rightActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center w-20 transition-opacity',
                colorClasses[action.color],
                Math.abs(offsetX) > index * 80 ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="flex flex-col items-center gap-1 text-xs font-medium">
                {action.icon}
                <span>{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn('transition-transform touch-pan-y', isDragging && 'transition-none')}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
