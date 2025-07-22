import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";
import { ImpactStyle } from "@capacitor/haptics";

const navigation = [
  {
    name: "Today",
    path: "/",
    icon: "🎯"
  },
  {
    name: "Planning", 
    path: "/planning",
    icon: "📋"
  },
  {
    name: "Journal",
    path: "/journal", 
    icon: "📖"
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: "📅"
  },
  {
    name: "Community",
    path: "/community",
    icon: "👥"
  },
  {
    name: "Insights",
    path: "/insights",
    icon: "🧠"
  }
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useMobile();

  const handleNavigation = async (path: string) => {
    await hapticFeedback(ImpactStyle.Light);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-strong">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200",
                "min-w-[60px] text-xs font-medium",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};