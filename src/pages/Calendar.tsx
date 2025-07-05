import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const [currentDate] = useState(new Date());
  
  // Get current month data
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Generate calendar days
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Sample progress data (you'd fetch this from your data source)
  const progressData: Record<number, { level: 'high' | 'medium' | 'low'; activities: string[] }> = {
    3: { level: 'low', activities: ['journal'] },
    5: { level: 'high', activities: ['sleep', 'habits'] },
    10: { level: 'medium', activities: ['journal', 'sleep'] },
    15: { level: 'high', activities: ['habits'] }
  };

  return (
    <div className="min-h-screen bg-gradient-calm pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-base text-muted-foreground">Plan and track your progress</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          📅
        </Button>
      </div>

      {/* Calendar */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon">
            ←
          </Button>
          <h2 className="text-xl font-semibold text-foreground">{monthName}</h2>
          <Button variant="ghost" size="icon">
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
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="aspect-square" />;
            }

            const isToday = day === currentDate.getDate() && 
                           currentMonth === new Date().getMonth() && 
                           currentYear === new Date().getFullYear();
            
            const dayProgress = progressData[day];
            const hasProgress = !!dayProgress;

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center text-sm relative rounded-lg transition-colors",
                  isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted/50",
                  !isToday && "text-foreground"
                )}
              >
                <span className="relative z-10">{day}</span>
                
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
                
                {hasProgress && (
                  <div className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full",
                    dayProgress.level === 'high' && "bg-progress-high",
                    dayProgress.level === 'medium' && "bg-progress-medium", 
                    dayProgress.level === 'low' && "bg-progress-low"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-foreground mb-3">Legend</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-progress-high" />
              <span className="text-sm text-foreground">High Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-progress-medium" />
              <span className="text-sm text-foreground">Medium Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-progress-low" />
              <span className="text-sm text-foreground">Low Progress</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs text-muted-foreground">Journal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-muted-foreground">Sleep</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-muted-foreground">Habits</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Calendar;