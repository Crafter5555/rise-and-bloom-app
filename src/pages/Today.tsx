import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { QuickActionButton } from "@/components/ui/quick-action-button";
import { AddTaskDialog } from "@/components/dialogs/AddTaskDialog";
import { AddWorkoutDialog } from "@/components/dialogs/AddWorkoutDialog";
import { Plus } from "lucide-react";

const Today = () => {
  const [todayProgress] = useState(0);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const inspirationalQuotes = [
    {
      quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill"
    },
    {
      quote: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      quote: "Don't be afraid to give up the good to go for the great.",
      author: "John D. Rockefeller"
    }
  ];

  const todayQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{dayName}, {monthDay}</h1>
          <p className="text-base text-muted-foreground">Today&apos;s Plan</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          📅
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">Progress</h2>
          <ProgressRing progress={todayProgress} size="lg">
            <span className="text-2xl font-bold text-primary">{todayProgress}%</span>
          </ProgressRing>
        </div>
      </Card>

      {/* Today's Plan Section */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">TODAY&apos;S PLAN</h3>
          <span className="text-sm text-primary font-medium">{todayProgress}%</span>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          0/0 completed
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No tasks planned yet</p>
          <p className="text-xs mt-1">Add some activities to get started</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <QuickActionButton
            icon="🎯"
            label="Add Goal"
            onClick={() => setAddTaskOpen(true)}
            variant="primary"
          />
          <QuickActionButton
            icon="💪"
            label="Workout"
            onClick={() => setAddWorkoutOpen(true)}
            variant="secondary"
          />
          <QuickActionButton
            icon="✅"
            label="Progress"
            onClick={() => {}}
            variant="success"
          />
        </div>
      </div>

      {/* Inspirational Quote */}
      <Card className="p-6 mb-6 shadow-soft bg-primary/5 border-primary/20">
        <div className="text-center">
          <p className="text-primary italic text-sm mb-2">
            &quot;{todayQuote.quote}&quot;
          </p>
          <p className="text-xs text-muted-foreground">
            — {todayQuote.author}
          </p>
        </div>
      </Card>

      {/* Floating Action Button */}
      <Button
        onClick={() => setAddTaskOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-strong bg-primary hover:bg-primary-dark"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Dialogs */}
      <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />
      <AddWorkoutDialog open={addWorkoutOpen} onOpenChange={setAddWorkoutOpen} />
    </div>
  );
};

export default Today;