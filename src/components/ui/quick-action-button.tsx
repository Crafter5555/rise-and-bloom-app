import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success";
  className?: string;
}

export const QuickActionButton = ({ 
  icon, 
  label, 
  onClick, 
  variant = "secondary",
  className 
}: QuickActionButtonProps) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-dark",
    secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
    success: "bg-success text-success-foreground hover:bg-success/90"
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 h-auto py-4 px-6 rounded-2xl shadow-soft",
        variants[variant],
        className
      )}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
};