import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { useToast } from "@/hooks/use-toast";

interface MorningPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MorningData {
  sleepQuality: number;
  sleepHours: number;
  mood: string;
  mainFocus: string;
  dailyGoals: string[];
  gratitude: string;
}

export const MorningPlanningDialog = ({ open, onOpenChange }: MorningPlanningDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [morningData, setMorningData] = useState<MorningData>({
    sleepQuality: 5,
    sleepHours: 8,
    mood: "",
    mainFocus: "",
    dailyGoals: ["", "", ""],
    gratitude: ""
  });
  const { toast } = useToast();
  const { createOrUpdateEntry } = useJournal();

  const totalSteps = 6;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the morning planning and save to database
      const today = new Date().toISOString().split('T')[0];
      const { error } = await createOrUpdateEntry('morning', today, {
        sleep_quality: morningData.sleepQuality,
        sleep_hours: morningData.sleepHours,
        morning_mood: 7,
        main_focus: morningData.mainFocus,
        top_priorities: morningData.dailyGoals.filter(g => g.trim()),
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save morning planning. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Morning planning completed! ☀️",
          description: "Your responses have been saved to your journal.",
        });
        handleClose();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setMorningData({
      sleepQuality: 5,
      sleepHours: 8,
      mood: "",
      mainFocus: "",
      dailyGoals: ["", "", ""],
      gratitude: ""
    });
    onOpenChange(false);
  };

  const updateSleepHours = (increment: boolean) => {
    setMorningData(prev => ({
      ...prev,
      sleepHours: Math.max(1, Math.min(24, prev.sleepHours + (increment ? 1 : -1)))
    }));
  };

  const updateDailyGoal = (index: number, value: string) => {
    setMorningData(prev => ({
      ...prev,
      dailyGoals: prev.dailyGoals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const addDailyGoal = () => {
    if (morningData.dailyGoals.length < 5) {
      setMorningData(prev => ({
        ...prev,
        dailyGoals: [...prev.dailyGoals, ""]
      }));
    }
  };

  const removeDailyGoal = (index: number) => {
    if (morningData.dailyGoals.length > 1) {
      setMorningData(prev => ({
        ...prev,
        dailyGoals: prev.dailyGoals.filter((_, i) => i !== index)
      }));
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return "☀️";
      case 2: return "⏰";
      case 3: return "❤️";
      case 4: return "⭐";
      case 5: return "✅";
      case 6: return "🙏";
      default: return "☀️";
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "How did you sleep last night?";
      case 2: return "How many hours did you sleep?";
      case 3: return "How do you feel this morning?";
      case 4: return "What's your main focus today?";
      case 5: return "What do you want to accomplish today?";
      case 6: return "Anything you're grateful for this morning?";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Rate your sleep quality from 1 (terrible) to 10 (amazing)";
      case 2: return "Include any naps from yesterday";
      case 3: return "Optional: Share your current mood or energy level";
      case 4: return "One key priority or theme for your day";
      case 5: return "List 3-5 specific goals (these will be added to your Today list)";
      case 6: return "Optional: Start your day with gratitude";
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
            <h2 className="text-lg font-semibold">Morning Planning</h2>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted">
          <div 
            className="h-full bg-warning transition-all duration-300 ease-out"
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
            {/* Step 1: Sleep Quality */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">
                    {morningData.sleepQuality}/10
                  </div>
                </div>
                <div className="px-4">
                  <Slider
                    value={[morningData.sleepQuality]}
                    onValueChange={([value]) => setMorningData(prev => ({ ...prev, sleepQuality: value }))}
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

            {/* Step 2: Sleep Hours */}
            {currentStep === 2 && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={() => updateSleepHours(false)}
                  >
                    <span className="text-xl">−</span>
                  </Button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-1">
                      {morningData.sleepHours}
                    </div>
                    <div className="text-sm text-muted-foreground">hours</div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={() => updateSleepHours(true)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Mood */}
            {currentStep === 3 && (
              <Textarea
                placeholder="I feel energized and ready to tackle the day..."
                value={morningData.mood}
                onChange={(e) => setMorningData(prev => ({ ...prev, mood: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
              />
            )}

            {/* Step 4: Main Focus */}
            {currentStep === 4 && (
              <Textarea
                placeholder="Complete the project presentation..."
                value={morningData.mainFocus}
                onChange={(e) => setMorningData(prev => ({ ...prev, mainFocus: e.target.value }))}
                className="min-h-[120px] resize-none text-center"
              />
            )}

            {/* Step 5: Daily Goals */}
            {currentStep === 5 && (
              <div className="space-y-4">
                {morningData.dailyGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Goal ${index + 1}...`}
                      value={goal}
                      onChange={(e) => updateDailyGoal(index, e.target.value)}
                      className="flex-1"
                    />
                    {morningData.dailyGoals.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDailyGoal(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {morningData.dailyGoals.length < 5 && (
                  <Button
                    variant="ghost"
                    onClick={addDailyGoal}
                    className="w-full justify-center text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another goal
                  </Button>
                )}
              </div>
            )}

            {/* Step 6: Gratitude */}
            {currentStep === 6 && (
              <Textarea
                placeholder="I'm grateful for my health, family, and this new opportunity..."
                value={morningData.gratitude}
                onChange={(e) => setMorningData(prev => ({ ...prev, gratitude: e.target.value }))}
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
              currentStep === totalSteps && "bg-success hover:bg-success/90"
            )}
          >
            {currentStep === totalSteps ? (
              <>
                ☀️ Start My Day
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