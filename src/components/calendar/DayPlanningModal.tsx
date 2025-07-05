import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Target, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DayPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSavePlan: (planData: any) => void;
}

export const DayPlanningModal = ({ isOpen, onClose, selectedDate, onSavePlan }: DayPlanningModalProps) => {
  const { user } = useAuth();
  const dateString = format(selectedDate, "EEEE, MMMM d, yyyy");
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  const [saving, setSaving] = useState(false);
  
  const [tasks, setTasks] = useState([
    { id: 1, title: "", category: "work", priority: "medium", timeEstimate: "" }
  ]);
  const [goals, setGoals] = useState([""]);
  const [intention, setIntention] = useState("");
  const [notes, setNotes] = useState("");
  const [focusTime, setFocusTime] = useState("");
  const [habits, setHabits] = useState({
    morningPlanning: true,
    exercise: false,
    journaling: true,
    meditation: false,
    eveningReflection: true
  });

  const addTask = () => {
    setTasks([...tasks, { 
      id: Date.now(), 
      title: "", 
      category: "work", 
      priority: "medium", 
      timeEstimate: "" 
    }]);
  };

  const updateTask = (id: number, field: string, value: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addGoal = () => {
    setGoals([...goals, ""]);
  };

  const updateGoal = (index: number, value: string) => {
    setGoals(goals.map((goal, i) => i === index ? value : goal));
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const planItems = [];
      let orderIndex = 0;
      
      // Add tasks to daily plans
      for (const task of tasks.filter(task => task.title.trim())) {
        planItems.push({
          user_id: user.id,
          plan_date: planDate,
          item_type: 'custom',
          title: task.title.trim(),
          description: `${task.category} - ${task.priority} priority${task.timeEstimate ? ` (${task.timeEstimate})` : ''}`,
          completed: false,
          order_index: orderIndex++
        });
      }
      
      // Add goals to daily plans
      for (const goal of goals.filter(goal => goal.trim())) {
        planItems.push({
          user_id: user.id,
          plan_date: planDate,
          item_type: 'goal',
          title: goal.trim(),
          description: intention.trim() || undefined,
          completed: false,
          order_index: orderIndex++
        });
      }
      
      // Add selected habits to daily plans
      for (const [habitKey, selected] of Object.entries(habits)) {
        if (selected) {
          const habitTitle = {
            morningPlanning: '☀️ Morning Planning',
            exercise: '💪 Exercise', 
            journaling: '📝 Journaling',
            meditation: '🧘 Meditation',
            eveningReflection: '🌙 Evening Reflection'
          }[habitKey] || habitKey;
          
          planItems.push({
            user_id: user.id,
            plan_date: planDate,
            item_type: 'habit',
            title: habitTitle,
            completed: false,
            order_index: orderIndex++
          });
        }
      }
      
      if (planItems.length > 0) {
        const { error } = await supabase
          .from('daily_plans')
          .insert(planItems);
          
        if (error) throw error;
      }
      
      toast.success('Day plan saved successfully!');
      onSavePlan({ date: selectedDate, itemsAdded: planItems.length });
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl mx-4 h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Plan your day for {dateString}</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Plan Your Day</h2>
            <p className="text-sm text-muted-foreground">{dateString}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4 mr-1" />
              Save Plan
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="tasks" className="h-full">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="focus">Focus</TabsTrigger>
            </TabsList>
            
            <div className="p-6 pt-4">
              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Tasks for the Day</h3>
                  <Button size="sm" onClick={addTask}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <Card key={task.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="What do you want to accomplish?"
                            value={task.title}
                            onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                            className="flex-1"
                          />
                          {tasks.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTask(task.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Select 
                            value={task.category} 
                            onValueChange={(value) => updateTask(task.id, 'category', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="work">💼 Work</SelectItem>
                              <SelectItem value="health">💪 Health</SelectItem>
                              <SelectItem value="personal">🏠 Personal</SelectItem>
                              <SelectItem value="learning">📚 Learning</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={task.priority} 
                            onValueChange={(value) => updateTask(task.id, 'priority', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">🔴 High</SelectItem>
                              <SelectItem value="medium">🟡 Medium</SelectItem>
                              <SelectItem value="low">🟢 Low</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="Time estimate"
                            value={task.timeEstimate}
                            onChange={(e) => updateTask(task.id, 'timeEstimate', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Planning Tips</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Start with your most important task</li>
                    <li>• Be realistic about time estimates</li>
                    <li>• Leave buffer time between tasks</li>
                  </ul>
                </Card>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Daily Goals & Intentions</h3>
                  <Button size="sm" onClick={addGoal}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Goal
                  </Button>
                </div>
                
                <Card className="p-4">
                  <Label className="text-sm font-medium mb-2 block">Main Intention for the Day</Label>
                  <Textarea
                    placeholder="What do you want to focus on today? How do you want to feel?"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    rows={3}
                  />
                </Card>
                
                <div className="space-y-3">
                  {goals.map((goal, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Input
                          placeholder="What specific goal do you want to achieve?"
                          value={goal}
                          onChange={(e) => updateGoal(index, e.target.value)}
                          className="flex-1"
                        />
                        {goals.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeGoal(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Habits Tab */}
              <TabsContent value="habits" className="space-y-4 mt-0">
                <h3 className="font-semibold">Habits to Focus On</h3>
                
                <Card className="p-4">
                  <div className="space-y-4">
                    {Object.entries(habits).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 cursor-pointer ${
                            value ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`} onClick={() => setHabits(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}>
                            {value && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className="font-medium">
                            {key === 'morningPlanning' && '☀️ Morning Planning'}
                            {key === 'exercise' && '💪 Exercise'}
                            {key === 'journaling' && '📝 Journaling'}
                            {key === 'meditation' && '🧘 Meditation'}
                            {key === 'eveningReflection' && '🌙 Evening Reflection'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Focus Tab */}
              <TabsContent value="focus" className="space-y-4 mt-0">
                <h3 className="font-semibold">Focus & Energy Planning</h3>
                
                <Card className="p-4">
                  <Label className="text-sm font-medium mb-2 block">Dedicated Focus Time</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 9:00 AM - 11:00 AM"
                      value={focusTime}
                      onChange={(e) => setFocusTime(e.target.value)}
                    />
                    <Badge variant="outline" className="px-3">
                      <Clock className="w-4 h-4 mr-1" />
                      Deep Work
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Block time for your most important work without distractions
                  </p>
                </Card>
                
                <Card className="p-4">
                  <Label className="text-sm font-medium mb-2 block">Notes & Reminders</Label>
                  <Textarea
                    placeholder="Any specific things to remember, prepare, or be mindful of today?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </Card>
                
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">🌱</span>
                    <span className="font-medium text-green-800">Energy Optimization</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Schedule demanding tasks during your peak energy hours</li>
                    <li>• Plan breaks between intensive activities</li>
                    <li>• Consider your natural rhythm and sleep schedule</li>
                  </ul>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};