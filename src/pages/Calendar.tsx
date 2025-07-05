import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { DayPlanningModal } from "@/components/calendar/DayPlanningModal";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showDayPlanning, setShowDayPlanning] = useState(false);
  
  // Calculate month data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDate = monthStart;
  const firstDayOfWeek = getDay(startDate);
  
  // Generate calendar grid with proper padding
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add actual month days
  monthDays.forEach(day => {
    calendarDays.push(day);
  });

  const monthName = format(currentDate, 'MMMM yyyy');
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Mock comprehensive progress data with more detailed information
  const getProgressData = (date: Date) => {
    const dayNum = date.getDate();
    const mockData: Record<number, { 
      level: 'high' | 'medium' | 'low';
      activities: string[];
      tasksCompleted: number;
      totalTasks: number;
      habitsCompleted: number;
      totalHabits: number;
      focusScore: number;
      mood: number;
    }> = {
      3: { 
        level: 'low', 
        activities: ['journal'], 
        tasksCompleted: 3,
        totalTasks: 8,
        habitsCompleted: 2,
        totalHabits: 5,
        focusScore: 6.2,
        mood: 7
      },
      5: { 
        level: 'high', 
        activities: ['sleep', 'habits', 'journal'], 
        tasksCompleted: 12,
        totalTasks: 14,
        habitsCompleted: 5,
        totalHabits: 6,
        focusScore: 8.9,
        mood: 9
      },
      10: { 
        level: 'medium', 
        activities: ['journal', 'sleep'], 
        tasksCompleted: 7,
        totalTasks: 11,
        habitsCompleted: 4,
        totalHabits: 6,
        focusScore: 7.3,
        mood: 8
      },
      15: { 
        level: 'high', 
        activities: ['habits', 'journal', 'sleep'], 
        tasksCompleted: 10,
        totalTasks: 12,
        habitsCompleted: 6,
        totalHabits: 6,
        focusScore: 8.5,
        mood: 8
      },
      18: { 
        level: 'medium', 
        activities: ['habits', 'sleep'], 
        tasksCompleted: 6,
        totalTasks: 9,
        habitsCompleted: 4,
        totalHabits: 5,
        focusScore: 7.1,
        mood: 7
      }
    };
    return mockData[dayNum] || null;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    
    if (isFuture(date) && !isToday(date)) {
      setShowDayPlanning(true);
    } else {
      setShowDayDetail(true);
    }
  };

  const handleEditDay = () => {
    setShowDayDetail(false);
    setShowDayPlanning(true);
  };

  const handleSavePlan = (planData: any) => {
    console.log('Saving plan for', planData.date, planData);
    // In real app, this would save to backend/state
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-base text-muted-foreground">Plan and track your progress</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setCurrentDate(new Date())}
        >
          📅
        </Button>
      </div>

      {/* Calendar */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateMonth('prev')}
          >
            ←
          </Button>
          <h2 className="text-xl font-semibold text-foreground">{monthName}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateMonth('next')}
          >
            →
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const isCurrentDay = isToday(day);
            const isFutureDay = isFuture(day) && !isToday(day);
            const dayProgress = getProgressData(day);
            const hasProgress = !!dayProgress;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center text-sm relative rounded-lg transition-all cursor-pointer",
                  isCurrentDay ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted/70 hover:shadow-md",
                  !isCurrentDay && "text-foreground",
                  isFutureDay && "hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent",
                  !isFutureDay && hasProgress && "hover:bg-green-50"
                )}
                onClick={() => handleDayClick(day)}
              >
                <span className="relative z-10 mb-1">{format(day, 'd')}</span>
                
                {/* Activity indicators */}
                {hasProgress && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayProgress.activities.includes('journal') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                    {dayProgress.activities.includes('sleep') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                    {dayProgress.activities.includes('habits') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}
                  </div>
                )}
                
                {/* Progress level indicator */}
                {hasProgress && (
                  <div className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full",
                    dayProgress.level === 'high' && "bg-progress-high",
                    dayProgress.level === 'medium' && "bg-progress-medium", 
                    dayProgress.level === 'low' && "bg-progress-low"
                  )} />
                )}

                {/* Future day indicator */}
                {isFutureDay && (
                  <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-400 opacity-60" />
                )}

                {/* Quick stats overlay on hover for past days */}
                {hasProgress && (
                  <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs p-1">
                    <div className="font-medium">{dayProgress.tasksCompleted}/{dayProgress.totalTasks} tasks</div>
                    <div className="text-xs">{dayProgress.focusScore}/10 focus</div>
                  </div>
                )}

                {/* Planning hint for future days */}
                {isFutureDay && (
                  <div className="absolute inset-0 bg-blue-500/90 rounded-lg opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    Plan Day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Enhanced Legend */}
      <Card className="p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-foreground mb-3">How to Use</h3>
        
        <div className="space-y-4">
          {/* Progress indicators */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Progress Levels</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-progress-high" />
                <span className="text-xs text-foreground">High Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-progress-medium" />
                <span className="text-xs text-foreground">Medium Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-progress-low" />
                <span className="text-xs text-foreground">Low Progress</span>
              </div>
            </div>
          </div>
          
          {/* Activity types */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Activity Types</div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs text-muted-foreground">Journal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground">Sleep</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground">Habits</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-600">💡</span>
              <span className="text-xs font-medium text-blue-800">Quick Guide</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>Click past days</strong> to see detailed progress and insights</li>
              <li>• <strong>Click future days</strong> to plan tasks, goals, and habits</li>
              <li>• <strong>Hover over days</strong> to see quick stats preview</li>
              <li>• <strong>Today</strong> is highlighted in blue for easy reference</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={showDayDetail}
          onClose={() => {
            setShowDayDetail(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onEditDay={handleEditDay}
        />
      )}

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

export default Calendar;