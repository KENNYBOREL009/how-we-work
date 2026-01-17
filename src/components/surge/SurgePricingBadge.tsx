import { Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SurgePricingBadgeProps {
  multiplier: number;
  className?: string;
  showTooltip?: boolean;
}

export const SurgePricingBadge = ({ 
  multiplier, 
  className,
  showTooltip = true 
}: SurgePricingBadgeProps) => {
  if (multiplier <= 1) return null;

  const getVariant = () => {
    if (multiplier >= 2) return "destructive";
    if (multiplier >= 1.5) return "default";
    return "secondary";
  };

  const getLabel = () => {
    if (multiplier >= 2) return "Très forte demande";
    if (multiplier >= 1.5) return "Forte demande";
    return "Demande élevée";
  };

  const badge = (
    <Badge 
      variant={getVariant()} 
      className={cn(
        "flex items-center gap-1 animate-pulse",
        multiplier >= 2 && "bg-red-500",
        multiplier >= 1.5 && multiplier < 2 && "bg-orange-500",
        className
      )}
    >
      {multiplier >= 1.5 ? (
        <Flame className="w-3 h-3" />
      ) : (
        <TrendingUp className="w-3 h-3" />
      )}
      <span>×{multiplier.toFixed(1)}</span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{getLabel()}</p>
          <p className="text-xs text-muted-foreground">
            Prix majoré de {Math.round((multiplier - 1) * 100)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
