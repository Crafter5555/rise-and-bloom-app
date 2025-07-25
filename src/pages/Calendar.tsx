import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { DayPlanningModal } from "@/components/calendar/DayPlanningModal";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showDayPlanning, setShowDayPlanning] = useState(false);
  const [realProgressData, setRealProgressData] = useState<Record<string, any>>({});
  
  const { user } = useAuth();
  
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
  
  // Fetch real progress data for the current month
  const fetchProgressData = async () => {
    if (!user) return;
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    try {
      // Get daily plans for the month
      const { data: dailyPlans } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .gte('plan_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('plan_date', format(monthEnd, 'yyyy-MM-dd'));
      
      // Get habit completions for the month
      const { data: habitCompletions } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('completion_date', format(monthEnd, 'yyyy-MM-dd'));
      
      // Get mood entries for the month
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('entry_date', format(monthEnd, 'yyyy-MM-dd'));
      
      // Process data by date
      const progressByDate: Record<string, any> = {};
      
      // Group daily plans by date
      dailyPlans?.forEach(plan => {
        const dateKey = plan.plan_date;
        if (!progressByDate[dateKey]) {
          progressByDate[dateKey] = {
            level: 'low',
            activities: [],
            tasksCompleted: 0,
            totalTasks: 0,
            habitsCompleted: 0,
            totalHabits: 0,
            focusScore: 0,
            mood: 0
          };
        }
        
        progressByDate[dateKey].totalTasks++;
        if (plan.completed) {
          progressByDate[dateKey].tasksCompleted++;
        }
        
        // Categorize activity types based on item_type
        if (plan.item_type === 'habit' && !progressByDate[dateKey].activities.includes('habits')) {
          progressByDate[dateKey].activities.push('habits');
        }
        if (plan.item_type === 'activity' && !progressByDate[dateKey].activities.includes('journal')) {
          progressByDate[dateKey].activities.push('journal');
        }
      });
      
      // Add habit completions
      habitCompletions?.forEach(completion => {
        const dateKey = completion.completion_date;
        if (progressByDate[dateKey]) {
          progressByDate[dateKey].habitsCompleted++;
        }
      });
      
      // Add mood data
      moodEntries?.forEach(entry => {
        const dateKey = entry.entry_date;
        if (progressByDate[dateKey]) {
          progressByDate[dateKey].mood = entry.mood_score;
          progressByDate[dateKey].focusScore = Math.random() * 3 + 7; // Mock focus score for now
        }
      });
      
      // Calculate progress levels
      Object.keys(progressByDate).forEach(dateKey => {
        const data = progressByDate[dateKey];
        const completionRate = data.totalTasks > 0 ? data.tasksCompleted / data.totalTasks : 0;
        
        if (completionRate >= 0.8) {
          data.level = 'high';
        } else if (completionRate >= 0.5) {
          data.level = 'medium';
        } else {
          data.level = 'low';
        }
        
        // Add sleep activity for days with mood entries
        if (data.mood > 0 && !data.activities.includes('sleep')) {
          data.activities.push('sleep');
        }
      });
      
      setRealProgressData(progressByDate);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };
  
  const getProgressData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return realProgressData[dateKey] || null;
  };
  
  useEffect(() => {
    fetchProgressData();
  }, [currentDate, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6 safe-area-inset">
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