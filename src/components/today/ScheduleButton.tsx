
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { UniversalScheduleModal } from "@/components/scheduling/UniversalScheduleModal";

interface ScheduleButtonProps {
  item: {
    id: string;
    title?: string;
    name?: string;
    type: "task" | "habit" | "activity" | "workout" | "goal";
  };
  onScheduled?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  // Rescheduling props
  existingPlanId?: string;
  isRescheduling?: boolean;
  initialDate?: Date;
  initialTime?: string;
  initialDuration?: number;
}

export const ScheduleButton = ({ 
  item, 
  onScheduled, 
  variant = "outline", 
  size = "sm",
  className = "",
  existingPlanId,
  isRescheduling = false,
  initialDate,
  initialTime,
  initialDuration
}: ScheduleButtonProps) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleScheduled = () => {
    onScheduled?.();
    setShowScheduleModal(false);
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={`text-primary ${className}`}
        onClick={() => setShowScheduleModal(true)}
      >
        <Calendar className="w-4 h-4 mr-1" />
        {isRescheduling ? "Reschedule" : "Schedule"}
      </Button>

      <UniversalScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        item={item}
        onScheduled={handleScheduled}
        existingPlanId={existingPlanId}
        isRescheduling={isRescheduling}
        initialDate={initialDate}
        initialTime={initialTime}
        initialDuration={initialDuration}
      />
    </>
  );
};
