import { ReactNode } from 'react';
import { PullToRefresh } from './PullToRefresh';
import { cn } from '@/lib/utils';

interface MobilePageProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  className?: string;
  enablePullToRefresh?: boolean;
  showBottomNav?: boolean;
}

export const MobilePage = ({
  children,
  onRefresh,
  className,
  enablePullToRefresh = false,
  showBottomNav = true,
}: MobilePageProps) => {
  const content = (
    <div
      className={cn(
        'min-h-screen bg-background',
        showBottomNav && 'pb-20',
        'safe-area-inset',
        className
      )}
    >
      {children}
    </div>
  );

  if (enablePullToRefresh && onRefresh) {
    return (
      <PullToRefresh onRefresh={onRefresh} className="h-screen overflow-auto">
        {content}
      </PullToRefresh>
    );
  }

  return content;
};
