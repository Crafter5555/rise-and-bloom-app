import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { X, Brain, Clock } from "lucide-react";

interface IntentionalityPopupProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
}

export const IntentionalityPopup = ({ isOpen, onClose, appName }: IntentionalityPopupProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const reasons = [
    { id: "habit", label: "😴 Habit/Boredom", color: "bg-gray-100 hover:bg-gray-200 text-gray-800" },
    { id: "post", label: "📝 Post Something", color: "bg-blue-100 hover:bg-blue-200 text-blue-800" },
    { id: "updates", label: "📰 Check Updates", color: "bg-green-100 hover:bg-green-200 text-green-800" },
    { id: "message", label: "💬 Message Someone", color: "bg-purple-100 hover:bg-purple-200 text-purple-800" },
    { id: "specific", label: "🎯 Specific Purpose", color: "bg-orange-100 hover:bg-orange-200 text-orange-800" },
    { id: "scroll", label: "🤷 Mindless Scroll", color: "bg-red-100 hover:bg-red-200 text-red-800" },
    { id: "custom", label: "✏️ Other...", color: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800" }
  ];

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    if (reasonId === "custom") {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomReason("");
    }
  };

  const handleContinue = () => {
    // In real app, this would log the reason and allow app to open
    console.log("User opening", appName, "for reason:", selectedReason, customReason);
    onClose();
    
    // Simulate opening the app (in real implementation, this would actually open the app)
    setTimeout(() => {
      alert(`Opening ${appName}... (This is just a demo)`);
    }, 500);
  };

  const handleTakeBreak = () => {
    // In real app, this would close the app request and maybe suggest alternatives
    console.log("User chose to take a break instead of opening", appName);
    onClose();
  };

  const resetState = () => {
    setSelectedReason("");
    setCustomReason("");
    setShowCustomInput(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getAppIcon = (appName: string) => {
    switch (appName.toLowerCase()) {
      case 'instagram': return '📸';
      case 'tiktok': return '🎵';
      case 'youtube': return '▶️';
      case 'twitter': case 'x': return '🐦';
      case 'facebook': return '👥';
      case 'reddit': return '🤖';
      default: return '📱';
    }
  };

  const getAppColor = (appName: string) => {
    switch (appName.toLowerCase()) {
      case 'instagram': return 'from-pink-400 to-purple-600';
      case 'tiktok': return 'from-black to-red-500';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'twitter': case 'x': return 'from-blue-400 to-blue-600';
      case 'facebook': return 'from-blue-500 to-blue-700';
      case 'reddit': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Why are you opening {appName}?</DialogTitle>
        
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${getAppColor(appName)} text-white relative`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="text-4xl mb-3">{getAppIcon(appName)}</div>
            <h2 className="text-xl font-semibold mb-2">
              Why are you opening {appName}?
            </h2>
            <p className="text-white/80 text-sm">
              Just checking in with your intention 💙
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time indicator */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last used 2 hours ago</span>
          </div>

          {/* Reason selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Choose what feels most true:</p>
            
            <div className="grid grid-cols-1 gap-2">
              {reasons.map((reason) => (
                <Button
                  key={reason.id}
                  variant="ghost"
                  onClick={() => handleReasonSelect(reason.id)}
                  className={cn(
                    "justify-start text-left h-auto p-3 transition-all",
                    reason.color,
                    selectedReason === reason.id && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {reason.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom reason input */}
          {showCustomInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">What's your specific reason?</label>
              <Textarea
                placeholder="e.g., Looking for workout inspiration..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Quick insight</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You've opened {appName} 8 times today, spending an average of 12 minutes per session. 
              Most sessions (75%) were for browsing/scrolling.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!selectedReason || (selectedReason === "custom" && !customReason.trim())}
            className="w-full"
          >
            Continue to {appName}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTakeBreak}
            className="w-full"
          >
            Actually, I'll take a break 🌱
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            No judgment here! Just building awareness 💙
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};