import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { MoodSlider } from "@/components/today/MoodSlider";
import { DailyPlanList } from "@/components/today/DailyPlanList";
import { InsightsPanel } from "@/components/today/InsightsPanel";
import { AIAssistantPanel } from "@/components/today/AIAssistantCard";
import { EveningCheckIn } from "@/components/today/EveningCheckIn";
import { AddToPlanSheet } from "@/components/today/AddToPlanSheet";

const Today = () => {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);
  const [focusInput, setFocusInput] = useState("");
  const [isEvening, setIsEvening] = useState(false);
  
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const userName = "Jamie"; // This would come from user profile
  
  // Check if it's evening (after 7 PM)
  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 19);
  }, []);

  const handleMoodChange = (mood: number) => {
    console.log("Mood changed to:", mood);
    // Save mood to storage or backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6">
      {/* Personalized Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Good {isEvening ? 'evening' : 'morning'}, {userName} 👋
        </h1>
        <p className="text-base text-muted-foreground">
          {dayName}, {monthDay}
        </p>
      </div>

      {/* Morning Mood Check or Evening Check-in */}
      <div className="mb-6">
        {isEvening ? (
          <EveningCheckIn />
        ) : (
          <>
            <MoodSlider onMoodChange={handleMoodChange} />
            
            {/* Daily Focus Input */}
            <div className="mt-4">
              <Input
                placeholder="What's one thing you want to focus on today?"
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                className="bg-white/80 border-0 shadow-sm"
              />
            </div>
          </>
        )}
      </div>

      {/* AI Assistant Suggestions */}
      <AIAssistantPanel />

      {/* Mini Insights Panel */}
      <InsightsPanel />

      {/* Today's Plan List */}
      <DailyPlanList />

      {/* Add to Plan Button */}
      <Button
        onClick={() => setAddToPlanOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add to Plan Sheet */}
      <AddToPlanSheet 
        open={addToPlanOpen} 
        onOpenChange={setAddToPlanOpen} 
      />
    </div>
  );
};

export default Today;