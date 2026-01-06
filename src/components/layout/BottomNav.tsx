import { MapPin, Wallet, Radio, User, Bus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBusMode } from "@/hooks/useBusMode";

const BottomNav = () => {
  const { isBusModeEnabled } = useBusMode();

  const navItems = [
    { icon: MapPin, label: "Carte", path: "/" },
    { icon: Radio, label: "Signal", path: "/signal" },
    ...(isBusModeEnabled ? [{ icon: Bus, label: "Bus", path: "/bus" }] : []),
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profil", path: "/profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-18 max-w-lg mx-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[64px]",
                isActive
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive && "bg-primary"
                )}>
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      isActive && "text-primary-foreground scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn(
                  "text-xs font-semibold transition-all",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
