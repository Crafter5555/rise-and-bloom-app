import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { ImpactStyle } from "@capacitor/haptics";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export const MobileHeader = ({
  title,
  subtitle,
  onBack,
  onMenu,
  rightAction,
  className,
  transparent = false
}: MobileHeaderProps) => {
  const { hapticFeedback } = useMobile();

  const handleBack = async () => {
    await hapticFeedback(ImpactStyle.Light);
    onBack?.();
  };

  const handleMenu = async () => {
    await hapticFeedback(ImpactStyle.Light);
    onMenu?.();
  };

  return (
    <header 
      className={cn(
        "flex items-center justify-between px-4 py-3 safe-area-pt",
        !transparent && "bg-background/95 backdrop-blur-sm border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightAction}
        {onMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenu}
            className="h-10 w-10 rounded-full"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};