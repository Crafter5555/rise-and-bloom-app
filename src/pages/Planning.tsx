import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayPlanningModal } from "@/components/calendar/DayPlanningModal";
import { AddHabitDialog } from "@/components/dialogs/AddHabitDialog";
import { AddGoalDialog } from "@/components/dialogs/AddGoalDialog";
import { AddTaskDialog } from "@/components/dialogs/AddTaskDialog";
import { AddActivityDialog } from "@/components/dialogs/AddActivityDialog";
import { AddWorkoutDialog } from "@/components/dialogs/AddWorkoutDialog";
import { AddRoutineDialog } from "@/components/dialogs/AddRoutineDialog";
import { UniversalScheduleModal } from "@/components/scheduling/UniversalScheduleModal";
import { HabitsList } from "@/components/planning/HabitsList";
import { GoalsList } from "@/components/planning/GoalsList";
import { TasksList } from "@/components/planning/TasksList";
import { ActivitiesList } from "@/components/planning/ActivitiesList";
import { WorkoutsList } from "@/components/planning/WorkoutsList";
import { WorkoutRoutinesList } from "@/components/planning/WorkoutRoutinesList";
import { useAutoScheduling } from "@/hooks/useAutoScheduling";
import { addDays, format, isToday, isTomorrow } from "date-fns";
import { Calendar, Plus, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayPlanning, setShowDayPlanning] = useState(false);
  const [plannedDays, setPlannedDays] = useState<Set<string>>(new Set()); // Track which days have plans
  
  // Dialog states
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [showRoutineDialog, setShowRoutineDialog] = useState(false);
  
  // Universal scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedItemToSchedule, setSelectedItemToSchedule] = useState<any>(null);
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    activeGoals: 0,
    habitsToday: { completed: 0, total: 0 },
    activities: 0,
    dailyTasks: 0
  });
  
  const { user } = useAuth();
  const { loading: autoScheduleLoading, generateAllDailyPlans } = useAutoScheduling();

  // Fetch metrics
  const fetchMetrics = async () => {
    if (!user) return;
    
    try {
      // Fetch active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      // Fetch active habits
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      // Fetch today's habit completions
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completion_date', today);
      
      // Fetch activities
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', user.id);
      
      // Fetch today's tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('due_date', today)
        .eq('completed', false);
      
      setMetrics({
        activeGoals: goals?.length || 0,
        habitsToday: {
          completed: completions?.length || 0,
          total: habits?.length || 0
        },
        activities: activities?.length || 0,
        dailyTasks: tasks?.length || 0
      });
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

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

  const handleDataUpdate = () => {
    fetchMetrics();
  };

  const handleAutoSchedule = async () => {
    await generateAllDailyPlans();
    handleDataUpdate();
  };

  // Universal scheduling handlers
  const handleScheduleTask = (task: any) => {
    setSelectedItemToSchedule({ ...task, type: 'task' });
    setShowScheduleModal(true);
  };

  const handleScheduleHabit = (habit: any) => {
    setSelectedItemToSchedule({ ...habit, type: 'habit' });
    setShowScheduleModal(true);
  };

  const handleScheduleActivity = (activity: any) => {
    setSelectedItemToSchedule({ ...activity, type: 'activity' });
    setShowScheduleModal(true);
  };

  const handleScheduleWorkout = (workout: any) => {
    setSelectedItemToSchedule({ ...workout, type: 'workout' });
    setShowScheduleModal(true);
  };

  const handleScheduled = () => {
    // Refresh data and close modal
    handleDataUpdate();
    setShowScheduleModal(false);
    setSelectedItemToSchedule(null);
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
    <div className="min-h-screen bg-background pb-20 px-4 pt-6 safe-area-inset">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Planning</h1>
        <p className="text-base text-muted-foreground">Organize your habits, goals, and activities</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MetricCard
          icon="🎯"
          title="Active Goals"
          value={metrics.activeGoals}
          color="primary"
        />
        <MetricCard
          icon="🔄"
          title="Habits Today"
          value={`${metrics.habitsToday.completed}/${metrics.habitsToday.total}`}
          color="accent"
        />
        <MetricCard
          icon="⚡"
          title="Activities"
          value={metrics.activities}
          color="warning"
        />
        <MetricCard
          icon="📋"
          title="Daily Tasks"
          value={metrics.dailyTasks}
          color="success"
        />
      </div>

      {/* Auto-Schedule Button */}
      <div className="mb-6">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Auto-Schedule Your Week</h3>
                <p className="text-sm text-muted-foreground">Automatically add habits, activities, goals & workouts to daily plans</p>
              </div>
            </div>
            <Button 
              onClick={handleAutoSchedule}
              disabled={autoScheduleLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {autoScheduleLoading ? "Scheduling..." : "Auto-Schedule"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Planning Sections */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Planning Hub</h3>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowHabitDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <h4 className="font-semibold text-foreground mb-1">Habits</h4>
                  <p className="text-xs text-muted-foreground mb-2">{metrics.habitsToday.total} active</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Add Habit
                  </Button>
                </div>
              </Card>
              
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowGoalDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-semibold text-foreground mb-1">Goals</h4>
                  <p className="text-xs text-muted-foreground mb-2">{metrics.activeGoals} active</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Add Goal
                  </Button>
                </div>
              </Card>
              
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowTaskDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <h4 className="font-semibold text-foreground mb-1">Tasks</h4>
                  <p className="text-xs text-muted-foreground mb-2">{metrics.dailyTasks} today</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Add Task
                  </Button>
                </div>
              </Card>
              
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowActivityDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-semibold text-foreground mb-1">Activities</h4>
                  <p className="text-xs text-muted-foreground mb-2">{metrics.activities} saved</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Add Activity
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Workout & Routines Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowWorkoutDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💪</div>
                  <h4 className="font-semibold text-foreground mb-1">Workouts</h4>
                  <p className="text-xs text-muted-foreground mb-2">Create workout routines</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Add Workout
                  </Button>
                </div>
              </Card>
              
              <Card 
                className="p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowRoutineDialog(true)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <h4 className="font-semibold text-foreground mb-1">Routines</h4>
                  <p className="text-xs text-muted-foreground mb-2">Automate workout scheduling</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    + Create Routine
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="habits" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Your Habits</h4>
              <Button onClick={() => setShowHabitDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Habit
              </Button>
            </div>
            <HabitsList onRefresh={handleDataUpdate} onScheduleHabit={handleScheduleHabit} />
          </TabsContent>
          
          <TabsContent value="goals" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Your Goals</h4>
              <Button onClick={() => setShowGoalDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <GoalsList onRefresh={handleDataUpdate} />
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Your Tasks</h4>
              <Button onClick={() => setShowTaskDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
            <TasksList onRefresh={handleDataUpdate} onScheduleTask={handleScheduleTask} />
          </TabsContent>
          
          <TabsContent value="activities" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Your Activities</h4>
              <Button onClick={() => setShowActivityDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
            <ActivitiesList onRefresh={handleDataUpdate} onScheduleActivity={handleScheduleActivity} />
          </TabsContent>
          
          <TabsContent value="workouts" className="mt-4">
            <div className="space-y-6">
              {/* Individual Workouts Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Individual Workouts</h4>
                  <Button onClick={() => setShowWorkoutDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workout
                  </Button>
                </div>
                <WorkoutsList onRefresh={handleDataUpdate} onScheduleWorkout={handleScheduleWorkout} />
              </div>
              
              {/* Workout Routines Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">Workout Routines</h4>
                    <p className="text-sm text-muted-foreground">Automatically schedule workouts throughout the week</p>
                  </div>
                  <Button onClick={() => setShowRoutineDialog(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Routine
                  </Button>
                </div>
                <WorkoutRoutinesList onRefresh={handleDataUpdate} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
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

      {/* Dialog Components */}
      <AddHabitDialog 
        open={showHabitDialog} 
        onOpenChange={setShowHabitDialog}
        onHabitAdded={handleDataUpdate}
      />
      
      <AddGoalDialog 
        open={showGoalDialog} 
        onOpenChange={setShowGoalDialog}
        onGoalAdded={handleDataUpdate}
      />
      
      <AddTaskDialog 
        open={showTaskDialog} 
        onOpenChange={setShowTaskDialog}
        onTaskAdded={handleDataUpdate}
      />
      
      <AddActivityDialog 
        open={showActivityDialog} 
        onOpenChange={setShowActivityDialog}
        onActivityAdded={handleDataUpdate}
      />
      
      <AddWorkoutDialog 
        open={showWorkoutDialog} 
        onOpenChange={setShowWorkoutDialog}
        onWorkoutAdded={handleDataUpdate}
      />
      
      <AddRoutineDialog 
        open={showRoutineDialog} 
        onOpenChange={setShowRoutineDialog}
        onRoutineAdded={handleDataUpdate}
      />

      {/* Universal Schedule Modal */}
      <UniversalScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        item={selectedItemToSchedule}
        onScheduled={handleScheduled}
      />
    </div>
  );
};

export default Planning;