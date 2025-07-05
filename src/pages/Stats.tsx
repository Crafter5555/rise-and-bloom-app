import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressRing } from "@/components/ui/progress-ring";

const Stats = () => {
  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Statistics</h1>
        <p className="text-base text-muted-foreground">Track your progress and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon="🔥"
          title="Current Streak"
          value="0"
          subtitle="days"
          color="warning"
        />
        <MetricCard
          icon="🏆"
          title="Goals Completed"
          value="0"
          subtitle="this month"
          color="success"
        />
        <MetricCard
          icon="💯"
          title="Habit Success"
          value="0%"
          subtitle="this week"
          color="accent"
        />
        <MetricCard
          icon="⏰"
          title="Avg. Productivity"
          value="0%"
          subtitle="daily"
          color="primary"
        />
      </div>

      {/* Weekly Progress */}
      <Card className="p-6 mb-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">This Week</h3>
        <div className="flex items-center justify-center">
          <ProgressRing progress={0} size="lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Activity Breakdown */}
      <Card className="p-6 mb-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activity Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium">Journaling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-xs text-muted-foreground w-8">0%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">💪</span>
              <span className="text-sm font-medium">Exercise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-xs text-muted-foreground w-8">0%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">🧘</span>
              <span className="text-sm font-medium">Meditation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-xs text-muted-foreground w-8">0%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Mood Tracking */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Mood</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">😊</div>
          <p className="text-sm text-muted-foreground">No mood data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start journaling to track your mood</p>
        </div>
      </Card>
    </div>
  );
};

export default Stats;