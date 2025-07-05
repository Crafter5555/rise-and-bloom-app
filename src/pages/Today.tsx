import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Settings } from "lucide-react";
import { DailyPlanList } from "@/components/today/DailyPlanList";
import { InsightsPanel } from "@/components/today/InsightsPanel";
import { AIAssistantPanel } from "@/components/today/AIAssistantCard";
import { EveningCheckIn } from "@/components/today/EveningCheckIn";
import { AddToPlanSheet } from "@/components/today/AddToPlanSheet";
import { QuizReminder } from "@/components/today/QuizReminder";
import { MorningPlanningDialog } from "@/components/dialogs/MorningPlanningDialog";
import { EveningReflectionDialog } from "@/components/dialogs/EveningReflectionDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { hasCompletedMorningQuiz, hasCompletedEveningQuiz } from "@/utils/quizStorage";

const Today = () => {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);
  const [showQuizReminder, setShowQuizReminder] = useState(true);
  const [quizType, setQuizType] = useState<"morning" | "evening">("morning");
  const [isEvening, setIsEvening] = useState(false);
  const [morningQuizOpen, setMorningQuizOpen] = useState(false);
  const [eveningQuizOpen, setEveningQuizOpen] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.username || "User";
  
  // Check if it's morning (6 AM - 12 PM) or evening (6 PM - 11 PM)
  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 18);
    setQuizType(hour >= 18 ? "evening" : "morning");
    
    // Show quiz reminders only during specific times and if not completed
    const showMorningQuiz = hour >= 6 && hour < 12 && !hasCompletedMorningQuiz();
    const showEveningQuiz = hour >= 18 && hour < 23 && !hasCompletedEveningQuiz();
    setShowQuizReminder(showMorningQuiz || showEveningQuiz);
  }, []);

  const handleStartQuiz = () => {
    if (quizType === "morning") {
      setMorningQuizOpen(true);
    } else {
      setEveningQuizOpen(true);
    }
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
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
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

      {/* Quiz Dialogs */}
      <MorningPlanningDialog 
        open={morningQuizOpen} 
        onOpenChange={setMorningQuizOpen} 
      />
      <EveningReflectionDialog 
        open={eveningQuizOpen} 
        onOpenChange={setEveningQuizOpen} 
      />
    </div>
  );
};

export default Today;