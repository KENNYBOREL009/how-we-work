import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverStats, DriverReliabilityScore } from "@/types";
import { DRIVER_RELIABILITY } from "@/lib/constants";

interface DriverHeaderProps {
  userName?: string;
  userInitial: string;
  stats: DriverStats;
  reliabilityScore?: DriverReliabilityScore | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

export const DriverHeader = ({
  userName = "Chauffeur",
  userInitial,
  stats,
  reliabilityScore,
  isOnline,
  onToggleOnline,
  onNotificationsClick,
  onSettingsClick,
}: DriverHeaderProps) => {
  const isSuspended = reliabilityScore?.blocked_until && 
    new Date(reliabilityScore.blocked_until) > new Date();
  
  const isLowScore = reliabilityScore && 
    reliabilityScore.reliability_score < DRIVER_RELIABILITY.BLOCK_RESERVATIONS_THRESHOLD;

  return (
    <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarFallback className="bg-white/20 font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">Bonjour, {userName}</p>
            <div className="flex items-center gap-1 text-sm text-primary-foreground/80">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{stats.rating}</span>
              <span>•</span>
              <span>{stats.acceptanceRate}% acceptation</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={onNotificationsClick}
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Reliability Score Warning */}
      {(isSuspended || isLowScore) && (
        <div className="mb-3 p-2 rounded-xl bg-destructive/20 border border-destructive/30 text-sm">
          {isSuspended ? (
            <span>⛔ Compte suspendu - {reliabilityScore?.suspension_reason}</span>
          ) : (
            <span>⚠️ Score faible ({reliabilityScore?.reliability_score}/100) - Accès réservations bloqué</span>
          )}
        </div>
      )}

      {/* Online toggle */}
      <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
          )} />
          <span className="font-medium">{isOnline ? "En service" : "Hors service"}</span>
        </div>
        <Switch 
          checked={isOnline} 
          onCheckedChange={onToggleOnline}
          disabled={isSuspended}
        />
      </div>
    </div>
  );
};
