import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <main className={showNav ? "flex-1 flex flex-col pb-24" : "flex-1 flex flex-col"}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
