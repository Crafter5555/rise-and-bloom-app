import { MobileContainer } from "@/components/mobile/MobileContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictiveAnalytics } from "@/components/insights/PredictiveAnalytics";
import { CorrelationAnalysis } from "@/components/analytics/CorrelationAnalysis";
import { HabitGuides } from "@/components/content/HabitGuides";
import { PerformanceOptimizer } from "@/components/performance/PerformanceOptimizer";
import { Brain, TrendingUp, BookOpen, Zap } from "lucide-react";

const Insights = () => {
  return (
    <MobileContainer>
      <MobileHeader 
        title="Insights" 
        subtitle="AI-powered personal analytics"
      />
      
      <div className="flex-1 overflow-auto px-4 pb-20">
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions" className="text-xs">
              <Brain className="w-4 h-4 mr-1" />
              AI
            </TabsTrigger>
            <TabsTrigger value="correlations" className="text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              Patterns
            </TabsTrigger>
            <TabsTrigger value="guides" className="text-xs">
              <BookOpen className="w-4 h-4 mr-1" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              Speed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <PredictiveAnalytics />
          </TabsContent>

          <TabsContent value="correlations" className="space-y-4">
            <CorrelationAnalysis />
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
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