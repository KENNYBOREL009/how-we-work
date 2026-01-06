import logoFull from "@/assets/logo-full.jpg";
import logoIcon from "@/assets/logo-icon.jpg";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { full: "h-8", icon: "h-8 w-8" },
  md: { full: "h-12", icon: "h-12 w-12" },
  lg: { full: "h-16", icon: "h-16 w-16" },
};

const Logo = ({ variant = "full", className = "", size = "md" }: LogoProps) => {
  const sizeClass = sizeMap[size][variant];

  if (variant === "icon") {
    return (
      <img
        src={logoIcon}
        alt="LOKEBO DRIVE"
        className={`${sizeClass} object-contain rounded-lg ${className}`}
      />
    );
  }

  return (
    <img
      src={logoFull}
      alt="LOKEBO DRIVE"
      className={`${sizeClass} object-contain ${className}`}
    />
  );
};

export default Logo;
