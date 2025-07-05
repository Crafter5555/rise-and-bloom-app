import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowLeft, X } from "lucide-react";

interface EveningReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EveningData {
  daySuccess: number;
  accomplishments: string;
  challenges: string;
  gratitude: string;
  tomorrowFocus: string;
}

export const EveningReflectionDialog = ({ open, onOpenChange }: EveningReflectionDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [eveningData, setEveningData] = useState<EveningData>({
    daySuccess: 7,
    accomplishments: "",
    challenges: "",
    gratitude: "",
    tomorrowFocus: ""
  });

  const totalSteps = 5;
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the evening reflection
      console.log("Evening reflection completed:", eveningData);
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
      daySuccess: 7,
      accomplishments: "",
      challenges: "",
      gratitude: "",
      tomorrowFocus: ""
    });
    onOpenChange(false);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return "🌟";
      case 2: return "🎯";
      case 3: return "💭";
      case 4: return "🙏";
      case 5: return "🌅";
      default: return "🌙";
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "How successful was your day?";
      case 2: return "What did you accomplish today?";
      case 3: return "What challenges did you face?";
      case 4: return "What are you grateful for today?";
      case 5: return "What's your focus for tomorrow?";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Rate your overall day from 1 (poor) to 10 (excellent)";
      case 2: return "Celebrate your wins, big and small";
      case 3: return "Reflect on obstacles and what you learned";
      case 4: return "End your day with appreciation";
      case 5: return "Set intention for tomorrow";
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
            className="h-full bg-purple-500 transition-all duration-300 ease-out"
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
            {/* Step 1: Day Success Rating */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {eveningData.daySuccess}/10
                  </div>
                </div>
                <div className="px-4">
                  <Slider
                    value={[eveningData.daySuccess]}
                    onValueChange={([value]) => setEveningData(prev => ({ ...prev, daySuccess: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Accomplishments */}
            {currentStep === 2 && (
              <Textarea
                placeholder="I completed my presentation, had a great workout, and connected with a friend..."
                value={eveningData.accomplishments}
                onChange={(e) => setEveningData(prev => ({ ...prev, accomplishments: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
              />
            )}

            {/* Step 3: Challenges */}
            {currentStep === 3 && (
              <Textarea
                placeholder="I struggled with time management but learned to prioritize better..."
                value={eveningData.challenges}
                onChange={(e) => setEveningData(prev => ({ ...prev, challenges: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
              />
            )}

            {/* Step 4: Gratitude */}
            {currentStep === 4 && (
              <Textarea
                placeholder="I'm grateful for my supportive team, good health, and the opportunity to learn..."
                value={eveningData.gratitude}
                onChange={(e) => setEveningData(prev => ({ ...prev, gratitude: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
              />
            )}

            {/* Step 5: Tomorrow's Focus */}
            {currentStep === 5 && (
              <Textarea
                placeholder="Tomorrow I want to focus on deep work and meaningful connections..."
                value={eveningData.tomorrowFocus}
                onChange={(e) => setEveningData(prev => ({ ...prev, tomorrowFocus: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
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
              currentStep === totalSteps && "bg-purple-500 hover:bg-purple-600"
            )}
          >
            {currentStep === totalSteps ? (
              <>
                🌙 Complete Reflection
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