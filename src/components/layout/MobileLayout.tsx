import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showThemeToggle?: boolean;
}

const MobileLayout = ({ children, showNav = true, showThemeToggle = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {showThemeToggle && (
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}
      <main className={showNav ? "flex-1 flex flex-col pb-24" : "flex-1 flex flex-col"}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
