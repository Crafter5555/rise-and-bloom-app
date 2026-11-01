import { useLocation, useNavigate } from "react-router-dom";
import { ListChecks, Dumbbell, Crosshair, Hash, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tap } from "@/iron/ui";

const navigation = [
  { name: "Protocol", path: "/", icon: ListChecks },
  { name: "Training", path: "/workouts", icon: Dumbbell },
  { name: "Actions", path: "/actions", icon: Crosshair },
  { name: "Board", path: "/board", icon: Hash },
  { name: "Stats", path: "/stats", icon: BarChart3 },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/auth") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {navigation.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button key={item.name} onClick={() => { tap(); navigate(item.path); }}
              className={cn("flex flex-col items-center justify-center h-16 gap-1 font-display text-[11px] transition-colors",
                active ? "text-primary" : "text-muted-foreground")}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              {item.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
