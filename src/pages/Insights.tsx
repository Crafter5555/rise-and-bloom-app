import { MobileContainer } from "@/components/mobile/MobileContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictiveAnalytics } from "@/components/insights/PredictiveAnalytics";
import { CorrelationAnalysis } from "@/components/analytics/CorrelationAnalysis";
import { HabitGuides } from "@/components/content/HabitGuides";
import { PerformanceOptimizer } from "@/components/performance/PerformanceOptimizer";
import { AILifeCoach } from "@/components/ai/AILifeCoach";
import { SmartInsights } from "@/components/ai/SmartInsights";
import { AchievementSystem } from "@/components/gamification/AchievementSystem";
import { SmartScheduler } from "@/components/scheduling/SmartScheduler";
import { Brain, TrendingUp, BookOpen, Zap, Trophy, Sparkles, Calendar } from "lucide-react";

const Insights = () => {
  return (
    <MobileContainer>
      <MobileHeader 
        title="Insights" 
        subtitle="AI-powered personal analytics"
      />
      
      <div className="flex-1 overflow-auto px-4 pb-20">
        <Tabs defaultValue="ai-coach" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="ai-coach" className="text-xs">
              <Brain className="w-4 h-4 mr-1" />
              Coach
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Sparkles className="w-4 h-4 mr-1" />
              Smart
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="text-xs">
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs">
              <Trophy className="w-4 h-4 mr-1" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="correlations" className="text-xs">
              <BookOpen className="w-4 h-4 mr-1" />
              Pattern
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              Speed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-coach" className="space-y-4">
            <AILifeCoach />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <SmartInsights />
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-4">
            <SmartScheduler />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AchievementSystem />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <PredictiveAnalytics />
          </TabsContent>

          <TabsContent value="correlations" className="space-y-4">
            <CorrelationAnalysis />
            <HabitGuides />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceOptimizer />
          </TabsContent>
        </Tabs>
      </div>
    </MobileContainer>
  );
};

export default Insights;