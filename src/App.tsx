
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TabNavigation } from "@/components/navigation/TabNavigation";
import Auth from "@/pages/Auth";
import Today from "@/pages/Today";
import Journal from "@/pages/Journal";
import Goals from "@/pages/Goals";
import Habits from "@/pages/Habits";
import Tasks from "@/pages/Tasks";
import Activities from "@/pages/Activities";
import Workouts from "@/pages/Workouts";
import DigitalWellbeing from "@/pages/DigitalWellbeing";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Debug from "@/pages/Debug";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Today />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/workouts" element={<Workouts />} />
                <Route path="/digital-wellbeing" element={<DigitalWellbeing />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/debug" element={<Debug />} />
              </Routes>
              <TabNavigation />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
