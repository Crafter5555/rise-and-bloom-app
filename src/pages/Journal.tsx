import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Journal = () => {
  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
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
        <Card className="p-4 shadow-soft bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="text-center">
            <div className="text-2xl mb-2">☀️</div>
            <h3 className="font-semibold text-foreground mb-1">Start your morning planning</h3>
            <p className="text-xs text-muted-foreground">Plan your day and set your focus</p>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="text-center">
            <div className="text-2xl mb-2">🌙</div>
            <h3 className="font-semibold text-foreground mb-1">Evening reflection time</h3>
            <p className="text-xs text-muted-foreground">Reflect on your day</p>
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
            <div className="text-2xl font-bold text-warning">0</div>
          </div>
        </div>
      </Card>

      {/* Recent Entries */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Entries</h3>
        
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📖</div>
          <h4 className="text-lg font-medium text-foreground mb-2">No journal entries yet</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Start journaling to track your thoughts and mood over time
          </p>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-strong bg-primary hover:bg-primary-dark"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Journal;