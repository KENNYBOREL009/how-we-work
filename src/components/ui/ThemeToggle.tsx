import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-xl ${className}`}
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted transition-all ${className}`}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-primary transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-foreground transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
};

export default ThemeToggle;
