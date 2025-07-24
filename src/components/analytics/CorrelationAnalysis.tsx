import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, Activity, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useRealCorrelations } from '@/hooks/useRealCorrelations';

interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  type: 'positive' | 'negative';
  confidence: number;
}

export const CorrelationAnalysis = () => {
  const { moodProductivityData, habitCorrelationData, isLoading } = useRealCorrelations();
  const [insights] = useState([
    {
      id: '1',
      title: 'Mood-Productivity Link',
      description: 'Higher mood scores correlate with better task completion rates',
      strength: 'strong',
      type: 'positive',
      confidence: 85
    },
    {
      id: '2',
      title: 'Morning Routine Impact',
      description: 'Days with completed morning routines show 23% higher productivity',
      strength: 'moderate',
      type: 'positive', 
      confidence: 78
    }
  ]);

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

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
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="x" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Mood (1-10)"
              />
              <Line 
                type="monotone" 
                dataKey="y" 
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
              <YAxis domain={[-100, 100]} />
              <Tooltip />
              <Bar 
                dataKey="correlation" 
                fill="#82ca9d"
                name="Correlation %"
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