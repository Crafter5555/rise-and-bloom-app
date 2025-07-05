import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Moon, Sun } from "lucide-react";

interface QuizReminderProps {
  type: "morning" | "evening";
  onStartQuiz: () => void;
  onDismiss: () => void;
}

export const QuizReminder = ({ type, onStartQuiz, onDismiss }: QuizReminderProps) => {
  const isMorning = type === "morning";
  
  return (
    <Card className={`p-4 mb-6 ${isMorning ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200' : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {isMorning ? <Sun className="w-6 h-6 text-orange-500" /> : <Moon className="w-6 h-6 text-indigo-500" />}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground mb-1">
            {isMorning ? "Good morning! 🌅" : "Evening reflection time 🌙"}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isMorning 
              ? "Take your morning wellness quiz to set intentions for the day"
              : "Complete your evening reflection to track your progress"
            }
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onStartQuiz}>
              {isMorning ? "Start Morning Quiz" : "Start Evening Quiz"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};