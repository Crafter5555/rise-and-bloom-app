
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Settings, Calendar, Brain, Target, Activity } from "lucide-react";
import { DailyPlanList } from "@/components/today/DailyPlanList";
import { InsightsPanel } from "@/components/today/InsightsPanel";
import { AIAssistantPanel } from "@/components/today/AIAssistantCard";
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
import { Card, CardContent } from "@/components/ui/card";
import { useRealStats } from "@/hooks/useRealStats";

const Today = () => {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showQuizReminder, setShowQuizReminder] = useState(true);
  const [quizType, setQuizType] = useState<"morning" | "evening">("morning");
  const [isEvening, setIsEvening] = useState(false);
  const [morningQuizOpen, setMorningQuizOpen] = useState(false);
  const [eveningQuizOpen, setEveningQuizOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [dailyQuote, setDailyQuote] = useState({
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  });
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { triggerHaptic, handleMobileClick } = useMobileOptimizations();
  const { stats } = useRealStats();
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
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill"
    },
    {
      text: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins"
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt"
    }
  ];
  
  // Check if it's morning or evening and set quiz reminders
  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 18);
    setQuizType(hour >= 18 ? "evening" : "morning");
    
    const showMorningQuiz = hour >= 6 && hour < 12 && !hasCompletedMorningQuiz();
    const showEveningQuiz = hour >= 18 && hour < 23 && !hasCompletedEveningQuiz();
    setShowQuizReminder(showMorningQuiz || showEveningQuiz);

    // Get consistent daily quote
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

  const handlePlanAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getEnergyColor = () => {
    if (energyLevel >= 8) return "text-primary";
    if (energyLevel >= 6) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6 safe-area-inset">
      {/* Enhanced Header with Energy Level */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base text-muted-foreground">
                  {dayName}, {monthDay}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Energy:</span>
                  <span className={`text-sm font-medium ${getEnergyColor()}`}>
                    {energyLevel}/10
                  </span>
                </div>
              </div>
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
        
        {/* Enhanced Quote Card */}
        <Card className="mb-4 border-primary/30 shadow-medium">
          <CardContent className="p-5">
            <div className="text-center space-y-3">
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                QUOTE OF THE DAY
              </div>
              <blockquote className="text-base font-semibold text-foreground leading-relaxed">
                "{dailyQuote.text}"
              </blockquote>
              <cite className="text-sm text-muted-foreground font-medium block">
                — {dailyQuote.author}
              </cite>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3 text-center border-border shadow-soft">
            <div className="flex flex-col items-center">
              <Target className="w-5 h-5 text-primary mb-1" />
              <span className="text-2xl font-extrabold text-foreground">{stats?.habits.total || 0}</span>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Habits</span>
            </div>
          </Card>
          <Card className="p-3 text-center border-border shadow-soft">
            <div className="flex flex-col items-center">
              <Activity className="w-5 h-5 text-primary mb-1" />
              <span className="text-2xl font-extrabold text-foreground">{stats?.today.completionRate || 0}%</span>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Done</span>
            </div>
          </Card>
          <Card className="p-3 text-center border-border shadow-soft">
            <div className="flex flex-col items-center">
              <Brain className="w-5 h-5 text-primary mb-1" />
              <span className="text-2xl font-extrabold text-foreground">{stats?.overview.currentStreak || 0}</span>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Streak</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quiz Reminder */}
      {showQuizReminder && (
        <QuizReminder
          type={quizType}
          onStartQuiz={handleStartQuiz}
          onDismiss={() => setShowQuizReminder(false)}
        />
      )}

      {/* Enhanced AI Assistant */}
      <AIAssistantPanel />

      {/* Insights Panel */}
      <InsightsPanel />

      {/* Daily Plan List */}
      <DailyPlanList key={refreshKey} />

      {/* Enhanced Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50">
        <Button
          onClick={handleMobileClick(() => setAddToPlanOpen(true))}
          variant="outline"
          className="w-12 h-12 rounded-full shadow-lg bg-background border-2 touch-target"
          size="icon"
        >
          <Calendar className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleMobileClick(() => setQuickAddOpen(true))}
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-target"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Sheets and Dialogs */}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onItemAdded={handlePlanAdded}
      />

      <AddToPlanSheet 
        open={addToPlanOpen} 
        onOpenChange={setAddToPlanOpen}
        onPlanAdded={handlePlanAdded}
      />

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
