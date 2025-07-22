
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import Auth from "@/pages/Auth";
import Today from "@/pages/Today";
import Journal from "@/pages/Journal";
import Planning from "@/pages/Planning";
import Calendar from "@/pages/Calendar";
import DigitalWellbeing from "@/pages/DigitalWellbeing";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Debug from "@/pages/Debug";
import { lazy, Suspense } from "react";

const Community = lazy(() => import("@/pages/Community"));
const Insights = lazy(() => import("@/pages/Insights"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

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
                <Route path="/planning" element={<Planning />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/digital-wellbeing" element={<DigitalWellbeing />} />
                <Route path="/community" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <Community />
                  </Suspense>
                } />
                <Route path="/insights" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <Insights />
                  </Suspense>
                } />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/debug" element={<Debug />} />
              </Routes>
              <BottomNavigation />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
