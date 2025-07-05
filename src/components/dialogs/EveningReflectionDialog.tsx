import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowLeft, X } from "lucide-react";
import { saveEveningQuiz } from "@/utils/quizStorage";
import { useToast } from "@/hooks/use-toast";

interface EveningReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EveningData {
  overallMood: number;
  energyLevel: number;
  completedGoals: string[];
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  improvements: string;
  otherThoughts: string;
  tomorrowPriority: string;
}

export const EveningReflectionDialog = ({ open, onOpenChange }: EveningReflectionDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [eveningData, setEveningData] = useState<EveningData>({
    overallMood: 5,
    energyLevel: 5,
    completedGoals: [],
    gratitude1: "",
    gratitude2: "",
    gratitude3: "",
    improvements: "",
    otherThoughts: "",
    tomorrowPriority: ""
  });
  const { toast } = useToast();

  const totalSteps = 10;
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Mock goals data - in real app this would come from state/props
  const mockGoals = ["fudis", "Exercise for 30 minutes", "Read for 20 minutes"];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the evening reflection
      saveEveningQuiz(eveningData);
      toast({
        title: "Evening reflection completed! 🌙",
        description: "Your responses have been saved to your journal.",
      });
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setEveningData({
      overallMood: 5,
      energyLevel: 5,
      completedGoals: [],
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improvements: "",
      otherThoughts: "",
      tomorrowPriority: ""
    });
    onOpenChange(false);
  };

  const handleGoalToggle = (goal: string, checked: boolean) => {
    if (checked) {
      setEveningData(prev => ({ 
        ...prev, 
        completedGoals: [...prev.completedGoals, goal] 
      }));
    } else {
      setEveningData(prev => ({ 
        ...prev, 
        completedGoals: prev.completedGoals.filter(g => g !== goal) 
      }));
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return "🌙";
      case 2: return "⭐";
      case 3: return "✅";
      case 4: return "❤️";
      case 5: return "🤔";
      case 6: return "💭";
      case 7: return "📱";
      case 8: return "📱";
      case 9: return "📝";
      case 10: return "🌅";
      default: return "🌙";
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "How did you feel overall today?";
      case 2: return "How was your energy today?";
      case 3: return "Let's review your goals";
      case 4: return "What are you thankful for today?";
      case 5: return "What could have gone better?";
      case 6: return "Any other thoughts?";
      case 7: return "Social Media Reflection";
      case 8: return "Was social media a distraction?";
      case 9: return "Daily Reflection Summary";
      case 10: return "What's your #1 priority for tomorrow?";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Rate your mood from 1 (terrible) to 10 (amazing)";
      case 2: return "Rate your energy from 1 (drained) to 10 (energized)";
      case 3: return "Mark the goals you completed today";
      case 4: return "List at least 3 things you're grateful for";
      case 5: return "Reflect on areas for improvement (optional)";
      case 6: return "Share what's on your mind (optional)";
      case 7: return "How meaningful was your screen time today?";
      case 8: return "Did it pull you away from something else you wanted to do?";
      case 9: return "Review your reflection";
      case 10: return "One main thing to focus on (optional)";
      default: return "";
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg mx-4 h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Evening Reflection</h2>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-2 text-center">
          <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">{getStepIcon()}</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {getStepTitle()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getStepSubtitle()}
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Overall Mood */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    {eveningData.overallMood}/10
                  </div>
                </div>
                <div className="px-4">
                  <Slider
                    value={[eveningData.overallMood]}
                    onValueChange={([value]) => setEveningData(prev => ({ ...prev, overallMood: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Terrible</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Energy Level */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {eveningData.energyLevel}/10
                  </div>
                </div>
                <div className="px-4">
                  <Slider
                    value={[eveningData.energyLevel]}
                    onValueChange={([value]) => setEveningData(prev => ({ ...prev, energyLevel: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Drained</span>
                    <span>Energized</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {mockGoals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Checkbox
                      checked={eveningData.completedGoals.includes(goal)}
                      onCheckedChange={(checked) => handleGoalToggle(goal, checked as boolean)}
                    />
                    <span className="text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Gratitude */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500 font-semibold">1.</span>
                  <Input
                    placeholder="Something you're grateful for..."
                    value={eveningData.gratitude1}
                    onChange={(e) => setEveningData(prev => ({ ...prev, gratitude1: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500 font-semibold">2.</span>
                  <Input
                    placeholder="Something you're grateful for..."
                    value={eveningData.gratitude2}
                    onChange={(e) => setEveningData(prev => ({ ...prev, gratitude2: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500 font-semibold">3.</span>
                  <Input
                    placeholder="Something you're grateful for..."
                    value={eveningData.gratitude3}
                    onChange={(e) => setEveningData(prev => ({ ...prev, gratitude3: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Improvements */}
            {currentStep === 5 && (
              <Textarea
                placeholder="What would you do differently? What challenges did you face?"
                value={eveningData.improvements}
                onChange={(e) => setEveningData(prev => ({ ...prev, improvements: e.target.value }))}
                className="min-h-[120px] resize-none"
              />
            )}

            {/* Step 6: Other Thoughts */}
            {currentStep === 6 && (
              <Textarea
                placeholder="How was your day? Any insights, feelings, or reflections..."
                value={eveningData.otherThoughts}
                onChange={(e) => setEveningData(prev => ({ ...prev, otherThoughts: e.target.value }))}
                className="min-h-[120px] resize-none"
              />
            )}

            {/* Step 7 & 8: Social Media Status */}
            {(currentStep === 7 || currentStep === 8) && (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                  <div className="text-green-600 font-semibold mb-1">
                    No social media usage detected today
                  </div>
                  <div className="text-green-500 text-sm">
                    Great job staying focused!
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Summary (placeholder) */}
            {currentStep === 9 && (
              <div className="text-center text-muted-foreground">
                <p>Take a moment to reflect on your responses before completing your evening reflection.</p>
              </div>
            )}

            {/* Step 10: Tomorrow's Priority */}
            {currentStep === 10 && (
              <Textarea
                placeholder="Your main focus for tomorrow..."
                value={eveningData.tomorrowPriority}
                onChange={(e) => setEveningData(prev => ({ ...prev, tomorrowPriority: e.target.value }))}
                className="min-h-[120px] resize-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            className={cn(
              "px-6",
              currentStep === totalSteps && "bg-green-500 hover:bg-green-600"
            )}
          >
            {currentStep === totalSteps ? (
              <>
                ✅ Complete Reflection
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};