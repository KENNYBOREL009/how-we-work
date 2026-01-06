import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface BusModeContextType {
  isBusModeEnabled: boolean;
  toggleBusMode: () => void;
}

const BusModeContext = createContext<BusModeContextType | undefined>(undefined);

export const BusModeProvider = ({ children }: { children: ReactNode }) => {
  const [isBusModeEnabled, setIsBusModeEnabled] = useState(() => {
    const saved = localStorage.getItem("lokebo-bus-mode");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("lokebo-bus-mode", String(isBusModeEnabled));
  }, [isBusModeEnabled]);

  const toggleBusMode = () => setIsBusModeEnabled((prev) => !prev);

  return (
    <BusModeContext.Provider value={{ isBusModeEnabled, toggleBusMode }}>
      {children}
    </BusModeContext.Provider>
  );
};

export const useBusMode = () => {
  const context = useContext(BusModeContext);
  if (!context) {
    throw new Error("useBusMode must be used within a BusModeProvider");
  }
  return context;
};
