import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: "primary" | "success" | "warning" | "accent";
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = "primary",
  className 
}: MetricCardProps) => {
  const colorClasses = {
    primary: "text-primary",
    success: "text-success", 
    warning: "text-warning",
    accent: "text-accent"
  };

  return (
    <Card className={cn("p-3 text-center space-y-1", className)}>
      {icon && <div className="text-xl">{icon}</div>}
      <div className={cn("text-xl font-bold", colorClasses[color])}>
        {value}
      </div>
      <div className="text-xs font-medium text-foreground">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">
          {subtitle}
        </div>
      )}
    </Card>
  );
};