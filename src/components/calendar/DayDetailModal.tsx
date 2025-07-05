import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit, Plus, CheckCircle, Clock, Brain, Smartphone, Heart } from "lucide-react";
import { format } from "date-fns";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onEditDay: () => void;
}

export const DayDetailModal = ({ isOpen, onClose, selectedDate, onEditDay }: DayDetailModalProps) => {
  const dateString = format(selectedDate, "EEEE, MMMM d, yyyy");
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isPast = selectedDate < new Date();
  const isFuture = selectedDate > new Date();

  // Mock comprehensive day data
  const dayData = {
    overallScore: 8.2,
    tasks: {
      completed: 8,
      total: 12,
      items: [
        { id: 1, title: "Review quarterly goals", completed: true, category: "work", priority: "high" },
        { id: 2, title: "Morning workout", completed: true, category: "health", priority: "medium" },
        { id: 3, title: "Team standup", completed: true, category: "work", priority: "high" },
        { id: 4, title: "Grocery shopping", completed: false, category: "personal", priority: "low" },
        { id: 5, title: "Read for 30 minutes", completed: false, category: "learning", priority: "medium" }
      ]
    },
    habits: {
      completed: 4,
      total: 6,
      items: [
        { name: "Morning Planning", completed: true, streak: 12 },
        { name: "Evening Reflection", completed: true, streak: 8 },
        { name: "Exercise", completed: true, streak: 5 },
        { name: "Meditation", completed: false, streak: 0 },
        { name: "Journaling", completed: true, streak: 7 },
        { name: "Water Intake", completed: false, streak: 0 }
      ]
    },
    digitalWellness: {
      screenTime: "3h 45m",
      pickups: 32,
      focusScore: 7.8,
      topApps: [
        { name: "Instagram", time: "58m", icon: "📸" },
        { name: "YouTube", time: "1h 12m", icon: "▶️" },
        { name: "Slack", time: "45m", icon: "💬" }
      ]
    },
    mood: {
      morning: { score: 8, note: "Feeling energized and motivated" },
      evening: { score: 7, note: "Good day overall, slightly tired" }
    },
    journal: {
      hasEntry: true,
      preview: "Had a productive morning, completed most important tasks. Need to focus more on evening routine..."
    },
    insights: [
      "Best focus window was 9-11 AM with 95% task completion",
      "Social media usage down 23% from yesterday",
      "Longest deep work session: 2h 15m"
    ]
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'health': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'learning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl mx-4 h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Day details for {dateString}</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{dateString}</h2>
            <div className="flex items-center gap-2 mt-1">
              {isToday && <Badge className="bg-blue-100 text-blue-800">Today</Badge>}
              {isPast && <Badge variant="outline">Past</Badge>}
              {isFuture && <Badge className="bg-green-100 text-green-800">Future</Badge>}
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Overall Score:</span>
                <span className="font-semibold text-primary">{dayData.overallScore}/10</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEditDay}>
              <Edit className="w-4 h-4 mr-1" />
              {isFuture ? 'Plan Day' : 'Edit'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="digital">Digital</TabsTrigger>
              <TabsTrigger value="wellness">Wellness</TabsTrigger>
            </TabsList>
            
            <div className="p-6 pt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Tasks</span>
                    </div>
                    <div className="text-2xl font-bold">{dayData.tasks.completed}/{dayData.tasks.total}</div>
                    <Progress value={(dayData.tasks.completed / dayData.tasks.total) * 100} className="h-2 mt-2" />
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Habits</span>
                    </div>
                    <div className="text-2xl font-bold">{dayData.habits.completed}/{dayData.habits.total}</div>
                    <Progress value={(dayData.habits.completed / dayData.habits.total) * 100} className="h-2 mt-2" />
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Focus</span>
                    </div>
                    <div className="text-2xl font-bold">{dayData.digitalWellness.focusScore}/10</div>
                    <div className="text-xs text-muted-foreground mt-1">{dayData.digitalWellness.screenTime} screen time</div>
                  </Card>
                </div>

                {/* Mood & Journal */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Mood & Reflection</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🌅</span>
                        <div>
                          <div className="text-sm font-medium">Morning Mood</div>
                          <div className="text-xs text-muted-foreground">{dayData.mood.morning.note}</div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-primary">{dayData.mood.morning.score}/10</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🌙</span>
                        <div>
                          <div className="text-sm font-medium">Evening Mood</div>
                          <div className="text-xs text-muted-foreground">{dayData.mood.evening.note}</div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-primary">{dayData.mood.evening.score}/10</div>
                    </div>
                    
                    {dayData.journal.hasEntry && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm font-medium mb-1 flex items-center gap-2">
                            <span>📝</span>
                            Journal Entry
                          </div>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {dayData.journal.preview}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* AI Insights */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    AI Insights
                  </h3>
                  <div className="space-y-2">
                    {dayData.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">{insight}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Tasks ({dayData.tasks.completed}/{dayData.tasks.total})</h3>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {dayData.tasks.items.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            task.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                          }`}>
                            {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getCategoryColor(task.category)}>
                            {task.category}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Digital Tab */}
              <TabsContent value="digital" className="space-y-4 mt-0">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{dayData.digitalWellness.screenTime}</div>
                    <div className="text-sm text-muted-foreground">Screen Time</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-warning">{dayData.digitalWellness.pickups}</div>
                    <div className="text-sm text-muted-foreground">Pickups</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-success">{dayData.digitalWellness.focusScore}/10</div>
                    <div className="text-sm text-muted-foreground">Focus Score</div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Top Apps</h3>
                  <div className="space-y-3">
                    {dayData.digitalWellness.topApps.map((app, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.icon}</span>
                          <span className="font-medium">{app.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{app.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Wellness Tab */}
              <TabsContent value="wellness" className="space-y-4 mt-0">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Habits</h3>
                  <div className="space-y-3">
                    {dayData.habits.items.map((habit, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            habit.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                          }`}>
                            {habit.completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium">{habit.name}</div>
                            <div className="text-xs text-muted-foreground">{habit.streak} day streak</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};