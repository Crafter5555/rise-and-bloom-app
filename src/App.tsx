import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { LoadingFallback } from "@/components/mobile/LoadingFallback";
import { IronProvider } from "@/iron/store";
import { lazy, Suspense } from "react";

const Auth = lazy(() => import("@/pages/Auth"));
const Settings = lazy(() => import("@/pages/Settings"));
const Protocol = lazy(() => import("@/iron/pages/Protocol"));
const Workouts = lazy(() => import("@/iron/pages/Workouts"));
const Actions = lazy(() => import("@/iron/pages/Actions"));
const Board = lazy(() => import("@/iron/pages/Board"));
const Stats = lazy(() => import("@/iron/pages/Stats"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <IronProvider>
              <div className="min-h-screen bg-background">
                <Suspense fallback={<LoadingFallback fullScreen message="Loading..." />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Protocol />} />
                    <Route path="/workouts" element={<Workouts />} />
                    <Route path="/actions" element={<Actions />} />
                    <Route path="/board" element={<Board />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                <BottomNavigation />
              </div>
            </IronProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
