import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  withBottomNav?: boolean;
  withHeader?: boolean;
}

export const MobileContainer = ({ 
  children, 
  className, 
  withBottomNav = true,
  withHeader = false 
}: MobileContainerProps) => {
  const { isKeyboardOpen } = useMobile();

  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        withHeader && "pt-safe-area",
        withBottomNav && !isKeyboardOpen && "pb-20",
        className
      )}
    >
      <div className="mx-auto max-w-md">
        {children}
      </div>
    </div>
  );
};