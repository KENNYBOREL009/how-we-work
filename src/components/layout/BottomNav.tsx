import { MapPin, Wallet, Megaphone, User, Bus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBusMode } from "@/hooks/useBusMode";

const BottomNav = () => {
  const { isBusModeEnabled } = useBusMode();

  const navItems = [
    { icon: MapPin, label: "Carte", path: "/" },
    { icon: Megaphone, label: "Siffler", path: "/signal" },
    ...(isBusModeEnabled ? [{ icon: Bus, label: "Bus", path: "/bus" }] : []),
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profil", path: "/profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-2xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                    isActive
                      ? "bg-primary shadow-md"
                      : "bg-transparent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "text-primary-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold transition-all",
                    isActive && "text-primary"
                  )}
                >
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
