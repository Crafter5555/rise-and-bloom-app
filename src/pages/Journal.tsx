import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MorningPlanningDialog } from "@/components/dialogs/MorningPlanningDialog";
import { EveningReflectionDialog } from "@/components/dialogs/EveningReflectionDialog";
import { VoiceInput } from "@/components/journal/VoiceInput";
import { Plus, Edit3 } from "lucide-react";
import { getRecentQuizEntries, hasCompletedMorningQuiz, hasCompletedEveningQuiz, getTodayDateKey } from "@/utils/quizStorage";

const Journal = () => {
  const [morningPlanningOpen, setMorningPlanningOpen] = useState(false);
  const [eveningReflectionOpen, setEveningReflectionOpen] = useState(false);
  const [recentEntries, setRecentEntries] = useState<Array<{ date: string; entry: any }>>([]);
  const [quickNote, setQuickNote] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);

  useEffect(() => {
    setRecentEntries(getRecentQuizEntries());
  }, []);

  const todayKey = getTodayDateKey();
  const hasTodayMorning = hasCompletedMorningQuiz();
  const hasTodayEvening = hasCompletedEveningQuiz();

  const handleVoiceTranscription = (text: string) => {
    setQuickNote(prev => prev + (prev ? ' ' : '') + text);
  };

  const saveQuickNote = () => {
    if (quickNote.trim()) {
      // Save to localStorage for now (could be enhanced to save to Supabase)
      const savedNotes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
      savedNotes.unshift({
        id: Date.now(),
        text: quickNote.trim(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('quickNotes', JSON.stringify(savedNotes.slice(0, 50))); // Keep last 50
      
      setQuickNote("");
      setShowQuickNote(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6 safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Reflect & Grow</span>
            <span className="text-lg">🌸</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Journal</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          📅
        </Button>
      </div>

      {/* Morning & Evening Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card 
          className={`p-4 shadow-soft bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 cursor-pointer hover:shadow-medium transition-shadow ${
            hasTodayMorning ? 'opacity-60' : ''
          }`}
          onClick={() => !hasTodayMorning && setMorningPlanningOpen(true)}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">{hasTodayMorning ? '✅' : '☀️'}</div>
            <h3 className="font-semibold text-foreground mb-1">
              {hasTodayMorning ? 'Morning planning complete' : 'Start your morning planning'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hasTodayMorning ? 'You completed your morning quiz today' : 'Plan your day and set your focus'}
            </p>
          </div>
        </Card>
        
        <Card 
          className={`p-4 shadow-soft bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 cursor-pointer hover:shadow-medium transition-shadow ${
            hasTodayEvening ? 'opacity-60' : ''
          }`}
          onClick={() => !hasTodayEvening && setEveningReflectionOpen(true)}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">{hasTodayEvening ? '✅' : '🌙'}</div>
            <h3 className="font-semibold text-foreground mb-1">
              {hasTodayEvening ? 'Evening reflection complete' : 'Evening reflection time'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hasTodayEvening ? 'You completed your evening reflection today' : 'Reflect on your day'}
            </p>
          </div>
        </Card>
      </div>

      {/* Day Streak */}
      <Card className="p-4 mb-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔥</div>
            <div>
              <h3 className="font-semibold text-foreground">Day Streak</h3>
              <p className="text-xs text-muted-foreground">Keep the momentum going</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-warning">
              {recentEntries.filter(e => e.entry.morning || e.entry.evening).length}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Entries */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Entries</h3>
        
        {recentEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📖</div>
            <h4 className="text-lg font-medium text-foreground mb-2">No journal entries yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Start journaling to track your thoughts and mood over time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEntries.map((entry, index) => (
              <Card key={index} className="p-4 shadow-soft">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-foreground">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <div className="flex gap-1">
                    {entry.entry.morning && <span className="text-yellow-500">☀️</span>}
                    {entry.entry.evening && <span className="text-blue-500">🌙</span>}
                  </div>
                </div>
                {entry.entry.morning && (
                  <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600">☀️</span>
                      <span className="text-sm font-medium text-yellow-800">Morning Planning</span>
                    </div>
                    {entry.entry.morning.mainFocus && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Focus:</strong> {entry.entry.morning.mainFocus}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>😴 {entry.entry.morning.sleepQuality}/10</span>
                      <span>⏰ {entry.entry.morning.sleepHours}h</span>
                    </div>
                  </div>
                )}
                {entry.entry.evening && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">🌙</span>
                      <span className="text-sm font-medium text-blue-800">Evening Reflection</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>😊 {entry.entry.evening.overallMood}/10</span>
                      <span>⚡ {entry.entry.evening.energyLevel}/10</span>
                      <span>✅ {entry.entry.evening.completedGoals.length} goals</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Note Section */}
      {showQuickNote && (
        <Card className="p-4 mb-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Quick Note</h3>
              <VoiceInput onTranscription={handleVoiceTranscription} />
            </div>
            <Textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Write a quick note or use voice input..."
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button onClick={saveQuickNote} disabled={!quickNote.trim()}>
                Save Note
              </Button>
              <Button variant="outline" onClick={() => setShowQuickNote(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-strong bg-primary hover:bg-primary-dark"
        size="icon"
        onClick={() => setShowQuickNote(true)}
      >
        <Edit3 className="w-6 h-6" />
      </Button>

      {/* Morning Planning Dialog */}
      <MorningPlanningDialog 
        open={morningPlanningOpen} 
        onOpenChange={setMorningPlanningOpen} 
      />
      
      {/* Evening Reflection Dialog */}
      <EveningReflectionDialog 
        open={eveningReflectionOpen} 
        onOpenChange={setEveningReflectionOpen} 
      />
    </div>
  );
};

export default Journal;