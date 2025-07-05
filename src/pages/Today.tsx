import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { DailyPlanList } from "@/components/today/DailyPlanList";
import { InsightsPanel } from "@/components/today/InsightsPanel";
import { AIAssistantPanel } from "@/components/today/AIAssistantCard";
import { EveningCheckIn } from "@/components/today/EveningCheckIn";
import { AddToPlanSheet } from "@/components/today/AddToPlanSheet";
import { QuizReminder } from "@/components/today/QuizReminder";
import { useAuth } from "@/contexts/AuthContext";

const Today = () => {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);
  const [showQuizReminder, setShowQuizReminder] = useState(true);
  const [quizType, setQuizType] = useState<"morning" | "evening">("morning");
  const [isEvening, setIsEvening] = useState(false);
  
  const { user, signOut } = useAuth();
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.username || "User";
  
  // Check if it's morning (6 AM - 12 PM) or evening (6 PM - 11 PM)
  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 18);
    setQuizType(hour >= 18 ? "evening" : "morning");
    
    // Show quiz reminders only during specific times
    const showMorningQuiz = hour >= 6 && hour < 12;
    const showEveningQuiz = hour >= 18 && hour < 23;
    setShowQuizReminder(showMorningQuiz || showEveningQuiz);
  }, []);

  const handleStartQuiz = () => {
    console.log(`Starting ${quizType} quiz`);
    // This would open the appropriate quiz dialog
    setShowQuizReminder(false);
  };

  const handleDismissQuiz = () => {
    setShowQuizReminder(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6">
      {/* Personalized Greeting */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Good {isEvening ? 'evening' : 'morning'}, {userName} 👋
          </h1>
          <p className="text-base text-muted-foreground">
            {dayName}, {monthDay}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Quiz Reminder */}
      {showQuizReminder && (
        <QuizReminder
          type={quizType}
          onStartQuiz={handleStartQuiz}
          onDismiss={handleDismissQuiz}
        />
      )}

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