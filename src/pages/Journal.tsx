import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MorningPlanningDialog } from "@/components/dialogs/MorningPlanningDialog";
import { EveningReflectionDialog } from "@/components/dialogs/EveningReflectionDialog";
import { VoiceInput } from "@/components/journal/VoiceInput";
import { Plus, Edit3 } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Journal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { entries, getStreak, hasCompletedToday } = useJournal();
  const [morningPlanningOpen, setMorningPlanningOpen] = useState(false);
  const [eveningReflectionOpen, setEveningReflectionOpen] = useState(false);
  const [hasTodayMorning, setHasTodayMorning] = useState(false);
  const [hasTodayEvening, setHasTodayEvening] = useState(false);
  const [streak, setStreak] = useState(0);
  const [quickNote, setQuickNote] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);

  useEffect(() => {
    const checkCompletions = async () => {
      const morning = await hasCompletedToday('morning');
      const evening = await hasCompletedToday('evening');
      setHasTodayMorning(morning);
      setHasTodayEvening(evening);
      const currentStreak = await getStreak();
      setStreak(currentStreak);
    };

    if (user) {
      checkCompletions();
    }
  }, [user, entries]);

  const handleVoiceTranscription = (text: string) => {
    setQuickNote(prev => prev + (prev ? ' ' : '') + text);
  };

  const saveQuickNote = async () => {
    if (quickNote.trim() && user) {
      try {
        const { error } = await supabase
          .from('mood_tracking')
          .insert({
            user_id: user.id,
            mood_score: 7,
            notes: quickNote.trim(),
            tags: ['quick-note']
          });

        if (error) throw error;

        toast({
          title: "Note Saved",
          description: "Your quick note has been saved successfully"
        });

        setQuickNote("");
        setShowQuickNote(false);
      } catch (error) {
        console.error('Error saving quick note:', error);
        toast({
          title: "Error",
          description: "Failed to save quick note",
          variant: "destructive"
        });
      }
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
              {streak}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Entries */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Entries</h3>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📖</div>
            <h4 className="text-lg font-medium text-foreground mb-2">No journal entries yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Start journaling to track your thoughts and mood over time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.slice(0, 10).map((entry) => (
              <Card key={entry.id} className="p-4 shadow-soft">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-foreground">
                    {new Date(entry.entry_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                  <div className="flex gap-1">
                    {entry.entry_type === 'morning' && <span className="text-yellow-500">☀️</span>}
                    {entry.entry_type === 'evening' && <span className="text-blue-500">🌙</span>}
                  </div>
                </div>
                {entry.entry_type === 'morning' && (
                  <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600">☀️</span>
                      <span className="text-sm font-medium text-yellow-800">Morning Planning</span>
                    </div>
                    {entry.main_focus && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Focus:</strong> {entry.main_focus}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {entry.sleep_quality && <span>😴 {entry.sleep_quality}/10</span>}
                      {entry.sleep_hours && <span>⏰ {entry.sleep_hours}h</span>}
                    </div>
                  </div>
                )}
                {entry.entry_type === 'evening' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">🌙</span>
                      <span className="text-sm font-medium text-blue-800">Evening Reflection</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {entry.overall_mood && <span>😊 {entry.overall_mood}/10</span>}
                      {entry.evening_energy && <span>⚡ {entry.evening_energy}/10</span>}
                      {entry.completed_goals && <span>✅ {(entry.completed_goals as string[]).length} goals</span>}
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