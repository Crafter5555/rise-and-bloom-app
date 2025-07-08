
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Settings, Calendar } from "lucide-react";
import { DailyPlanList } from "@/components/today/DailyPlanList";
import { InsightsPanel } from "@/components/today/InsightsPanel";
import { AIAssistantPanel } from "@/components/today/AIAssistantCard";
import { EveningCheckIn } from "@/components/today/EveningCheckIn";
import { AddToPlanSheet } from "@/components/today/AddToPlanSheet";
import { QuickAddSheet } from "@/components/today/QuickAddSheet";
import { QuizReminder } from "@/components/today/QuizReminder";
import { MorningPlanningDialog } from "@/components/dialogs/MorningPlanningDialog";
import { EveningReflectionDialog } from "@/components/dialogs/EveningReflectionDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { hasCompletedMorningQuiz, hasCompletedEveningQuiz } from "@/utils/quizStorage";
import { SyncStatus } from "@/components/mobile/SyncStatus";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";

const Today = () => {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showQuizReminder, setShowQuizReminder] = useState(true);
  const [quizType, setQuizType] = useState<"morning" | "evening">("morning");
  const [isEvening, setIsEvening] = useState(false);
  const [morningQuizOpen, setMorningQuizOpen] = useState(false);
  const [eveningQuizOpen, setEveningQuizOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dailyQuote, setDailyQuote] = useState({
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  });
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { triggerHaptic, handleMobileClick } = useMobileOptimizations();
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.username || "User";

  const quotes = [
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt"
    },
    {
      text: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle"
    },
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill"
    },
    {
      text: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins"
    },
    {
      text: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein"
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt"
    },
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs"
    },
    {
      text: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon"
    },
    {
      text: "The future depends on what you do today.",
      author: "Mahatma Gandhi"
    }
  ];
  
  // Check if it's morning (6 AM - 12 PM) or evening (6 PM - 11 PM)
  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 18);
    setQuizType(hour >= 18 ? "evening" : "morning");
    
    // Show quiz reminders only during specific times and if not completed
    const showMorningQuiz = hour >= 6 && hour < 12 && !hasCompletedMorningQuiz();
    const showEveningQuiz = hour >= 18 && hour < 23 && !hasCompletedEveningQuiz();
    setShowQuizReminder(showMorningQuiz || showEveningQuiz);

    // Get a consistent quote for the day based on the date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    setDailyQuote(quotes[quoteIndex]);
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

  const handlePlanAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6 safe-area-inset">
      {/* Personalized Greeting */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Good {isEvening ? 'evening' : 'morning'}, {userName} 👋
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-base text-muted-foreground">
                {dayName}, {monthDay}
              </p>
              <SyncStatus />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleMobileClick(() => navigate('/settings'))}
              className="text-muted-foreground hover:text-foreground touch-target"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleMobileClick(signOut)}
              className="text-muted-foreground hover:text-foreground touch-target"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Quote of the Day */}
        <div className="p-3 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-lg">
          <div className="text-center">
            <blockquote className="text-sm font-medium text-foreground mb-1 leading-relaxed">
              "{dailyQuote.text}"
            </blockquote>
            <cite className="text-xs text-muted-foreground font-medium">
              — {dailyQuote.author}
            </cite>
          </div>
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
      <DailyPlanList key={refreshKey} />

      {/* Quick Add Button - Primary */}
      <Button
        onClick={handleMobileClick(() => setQuickAddOpen(true))}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-target z-50 safe-area-bottom"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Advanced Add Button - Secondary */}
      <Button
        onClick={handleMobileClick(() => setAddToPlanOpen(true))}
        variant="outline"
        className="fixed bottom-24 right-24 w-12 h-12 rounded-full shadow-lg bg-background border-2 touch-target z-40"
        size="icon"
      >
        <Calendar className="w-5 h-5" />
      </Button>

      {/* Quick Add Sheet */}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onItemAdded={handlePlanAdded}
      />

      {/* Advanced Add to Plan Sheet */}
      <AddToPlanSheet 
        open={addToPlanOpen} 
        onOpenChange={setAddToPlanOpen}
        onPlanAdded={handlePlanAdded}
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
