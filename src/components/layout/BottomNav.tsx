import { MapPin, Wallet, Search, User, Bus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBusMode } from "@/hooks/useBusMode";

const BottomNav = () => {
  const { isBusModeEnabled } = useBusMode();

  const navItems = [
    { icon: MapPin, label: "Carte", path: "/" },
    { icon: Search, label: "Signal", path: "/signal" },
    ...(isBusModeEnabled ? [{ icon: Bus, label: "Bus", path: "/bus" }] : []),
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profil", path: "/profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
