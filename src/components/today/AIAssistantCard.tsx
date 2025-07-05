import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AIAssistantCardProps {
  suggestion: string;
  action?: string;
  onDismiss?: () => void;
  onAction?: () => void;
}

const suggestions = [
  "You have a 1-hour break at 3PM — want to plan something?",
  "You've completed 2 of 3 habits — nice work! 🎉",
  "Want to reflect for a minute before opening Instagram?",
  "Perfect time for a 10-minute walk to energize your afternoon",
];

export const AIAssistantCard = ({ 
  suggestion, 
  action = "Sure!", 
  onDismiss, 
  onAction 
}: AIAssistantCardProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🤖</div>
        <div className="flex-1">
          <p className="text-sm text-foreground mb-3">{suggestion}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAction}>
              {action}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Maybe later
            </Button>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-6 h-6 p-0 text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export const AIAssistantPanel = () => {
  const [currentSuggestion, setCurrentSuggestion] = useState(suggestions[0]);
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleAction = () => {
    // Handle the action (could open dialog, add item, etc.)
    console.log("AI suggestion accepted:", currentSuggestion);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6">
      <AIAssistantCard
        suggestion={currentSuggestion}
        onDismiss={handleDismiss}
        onAction={handleAction}
      />
    </div>
  );
};