import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { DayPlanningModal } from "@/components/calendar/DayPlanningModal";
import { addDays, format, isToday, isTomorrow } from "date-fns";
import { Calendar, Plus, CheckCircle2 } from "lucide-react";

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayPlanning, setShowDayPlanning] = useState(false);
  const [plannedDays, setPlannedDays] = useState<Set<string>>(new Set()); // Track which days have plans

  // Generate next 7 days for planning
  const getUpcomingDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  };

  const upcomingDays = getUpcomingDays();

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayPlanning(true);
  };

  const handleSavePlan = (planData: any) => {
    const dateKey = format(planData.date, 'yyyy-MM-dd');
    setPlannedDays(prev => new Set([...prev, dateKey]));
    console.log('Plan saved for', dateKey, planData);
    // In real app, this would save to backend/state
  };

  const getDayDisplayName = (date: Date) => {
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  const isDayPlanned = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return plannedDays.has(dateKey);
  };

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Planning</h1>
        <p className="text-base text-muted-foreground">Organize your habits, goals, and activities</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-2">
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

      {/* Plan Future Days */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Plan Future Days</h3>
              <p className="text-sm text-muted-foreground">Click on any day to start planning</p>
            </div>
          </div>
        </div>

        {/* Upcoming Days Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {upcomingDays.map((date, index) => {
            const isPlanned = isDayPlanned(date);
            return (
              <Card 
                key={index}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isPlanned ? 'bg-green-50 border-green-200' : 'hover:bg-blue-50 hover:border-blue-200'
                }`}
                onClick={() => handleDayClick(date)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {getDayDisplayName(date)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(date, "MMM d")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlanned ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                {isPlanned && (
                  <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    Planned ✓
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Quick Planning Tip */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Planning Made Simple</span>
          </div>
          <p className="text-sm text-blue-700">
            Plan your upcoming days by clicking on any day above. Set tasks, goals, and habits to stay organized and focused.
          </p>
        </Card>
      </div>

      {/* Day Planning Modal */}
      {selectedDate && (
        <DayPlanningModal
          isOpen={showDayPlanning}
          onClose={() => {
            setShowDayPlanning(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onSavePlan={handleSavePlan}
        />
      )}
    </div>
  );
};

export default Planning;