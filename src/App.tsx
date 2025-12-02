
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { LoadingFallback } from "@/components/mobile/LoadingFallback";
import { lazy, Suspense } from "react";

const Auth = lazy(() => import("@/pages/Auth"));
const Today = lazy(() => import("@/pages/Today"));
const Journal = lazy(() => import("@/pages/Journal"));
const Planning = lazy(() => import("@/pages/Planning"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const DigitalWellbeing = lazy(() => import("@/pages/DigitalWellbeing"));
const Stats = lazy(() => import("@/pages/Stats"));
const Settings = lazy(() => import("@/pages/Settings"));
const Debug = lazy(() => import("@/pages/Debug"));
const Community = lazy(() => import("@/pages/Community"));
const Insights = lazy(() => import("@/pages/Insights"));
const Journeys = lazy(() => import("@/pages/Journeys"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
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
              <Suspense fallback={<LoadingFallback fullScreen message="Loading page..." />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Today />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/planning" element={<Planning />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/digital-wellbeing" element={<DigitalWellbeing />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/journeys" element={<Journeys />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/debug" element={<Debug />} />
                </Routes>
              </Suspense>
              <BottomNavigation />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
