import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { QuickActionButton } from "@/components/ui/quick-action-button";

const Planning = () => {
  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Planning</h1>
        <p className="text-base text-muted-foreground">Organize your habits, goals, and activities</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon="🎯"
          title="Active Goals"
          value="0"
          color="primary"
        />
        <MetricCard
          icon="🔄"
          title="Habits Today"
          value="0/0"
          color="accent"
        />
        <MetricCard
          icon="⚡"
          title="Activities"
          value="1"
          color="warning"
        />
        <MetricCard
          icon="📋"
          title="Daily Tasks"
          value="1"
          color="success"
        />
      </div>

      {/* Plan Future Days */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plan Future Days</h3>
            <p className="text-sm text-muted-foreground">Add tasks and activities to upcoming days</p>
          </div>
        </div>
      </Card>

      {/* Quick Access Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold text-foreground mb-1">Habits</h4>
              <p className="text-xs text-muted-foreground mb-2">0 active</p>
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-foreground mb-1">Goals</h4>
              <p className="text-xs text-muted-foreground mb-2">0 total</p>
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <h4 className="font-semibold text-foreground mb-1">Tasks</h4>
              <p className="text-xs text-muted-foreground mb-2">1 daily</p>
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-foreground mb-1">Activities</h4>
              <p className="text-xs text-muted-foreground mb-2">1 saved</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Planning;