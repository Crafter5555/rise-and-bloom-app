
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, Calendar, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  type: 'positive' | 'negative';
  confidence: number;
}

export const CorrelationAnalysis = () => {
  const [insights, setInsights] = useState<CorrelationInsight[]>([]);
  const [moodProductivityData, setMoodProductivityData] = useState<any[]>([]);
  const [habitCorrelationData, setHabitCorrelationData] = useState<any[]>([]);

  useEffect(() => {
    // Mock correlation insights
    const mockInsights: CorrelationInsight[] = [
      {
        id: '1',
        title: 'Exercise → Better Sleep',
        description: 'Days when you exercise, you sleep 23% better on average',
        strength: 'strong',
        type: 'positive',
        confidence: 89
      },
      {
        id: '2',
        title: 'Morning Meditation → Productivity',
        description: 'Morning meditation sessions correlate with 31% higher task completion',
        strength: 'moderate',
        type: 'positive',
        confidence: 76
      },
      {
        id: '3',
        title: 'Late Screen Time → Morning Energy',
        description: 'Screen time after 9 PM reduces next-day energy levels by 18%',
        strength: 'moderate',
        type: 'negative',
        confidence: 82
      }
    ];

    // Mock mood vs productivity data
    const mockMoodData = [
      { day: 'Mon', mood: 7, productivity: 85 },
      { day: 'Tue', mood: 8, productivity: 92 },
      { day: 'Wed', mood: 6, productivity: 78 },
      { day: 'Thu', mood: 9, productivity: 95 },
      { day: 'Fri', mood: 7, productivity: 88 },
      { day: 'Sat', mood: 8, productivity: 82 },
      { day: 'Sun', mood: 7, productivity: 75 }
    ];

    // Mock habit correlation data
    const mockHabitData = [
      { habit: 'Exercise', correlation: 0.89, impact: 'High' },
      { habit: 'Meditation', correlation: 0.76, impact: 'Medium' },
      { habit: 'Reading', correlation: 0.64, impact: 'Medium' },
      { habit: 'Journaling', correlation: 0.58, impact: 'Medium' },
      { habit: 'Social Media', correlation: -0.34, impact: 'Low' }
    ];

    setInsights(mockInsights);
    setMoodProductivityData(mockMoodData);
    setHabitCorrelationData(mockHabitData);
  }, []);

  const getStrengthColor = (strength: string) => {
    const colors = {
      weak: 'text-yellow-600',
      moderate: 'text-orange-600',
      strong: 'text-green-600'
    };
    return colors[strength as keyof typeof colors];
  };

  const getTypeIcon = (type: string) => {
    return type === 'positive' ? '↗️' : '↘️';
  };

  return (
    <div className="space-y-6">
      {/* Correlation Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Behavior Correlations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    {getTypeIcon(insight.type)}
                    {insight.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getStrengthColor(insight.strength)}`}>
                      {insight.strength}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mood vs Productivity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Mood vs Productivity Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodProductivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Mood (1-10)"
              />
              <Line 
                type="monotone" 
                dataKey="productivity" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Productivity %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Habit Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Habit Impact on Well-being
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={habitCorrelationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="habit" />
              <YAxis domain={[-1, 1]} />
              <Tooltip />
              <Bar 
                dataKey="correlation" 
                fill={(entry) => entry > 0 ? "#82ca9d" : "#ff7300"}
                name="Correlation"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Positive values indicate habits that improve well-being, negative values indicate detrimental patterns
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
