import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DriverDefaultNotificationProps {
  type: 'client' | 'driver';
  defaultType: 'cancellation' | 'ghosting';
  // Client props
  holdReleased?: boolean;
  // Driver props
  penaltyPoints?: number;
  newScore?: number;
  isSuspended?: boolean;
  blockedUntil?: string;
  schedulingBlocked?: boolean;
  onDismiss?: () => void;
  onSearchNewTaxi?: () => void;
}

export const DriverDefaultNotification: React.FC<DriverDefaultNotificationProps> = ({
  type,
  defaultType,
  holdReleased,
  penaltyPoints,
  newScore,
  isSuspended,
  blockedUntil,
  schedulingBlocked,
  onDismiss,
  onSearchNewTaxi,
}) => {
  if (type === 'client') {
    return (
      <div className="fixed inset-x-4 top-20 z-50 animate-in slide-in-from-top-4">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {defaultType === 'cancellation' 
                    ? 'Réservation annulée par le chauffeur' 
                    : 'Le chauffeur n\'est pas passé'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nous sommes désolés pour ce désagrément
                </p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {holdReleased && (
              <div className="flex items-center gap-3 bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Argent débloqué instantanément
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Votre caution a été reversée sur votre solde disponible
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-primary/10 rounded-xl p-3 border border-primary/20">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Recherche d'un nouveau taxi prioritaire en cours...
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={onSearchNewTaxi}
                className="flex-1"
                variant="default"
              >
                Rechercher un taxi
              </Button>
              <Button 
                onClick={onDismiss}
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Driver notification
  return (
    <div className="fixed inset-x-4 top-20 z-50 animate-in slide-in-from-top-4">
      <div className={cn(
        "bg-card border rounded-2xl shadow-xl overflow-hidden",
        isSuspended ? "border-destructive/50" : "border-amber-500/50"
      )}>
        {/* Header */}
        <div className={cn(
          "border-b p-4",
          isSuspended 
            ? "bg-destructive/10 border-destructive/20" 
            : "bg-amber-500/10 border-amber-500/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isSuspended ? "bg-destructive/20" : "bg-amber-500/20"
            )}>
              {isSuspended ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isSuspended 
                  ? 'Compte suspendu' 
                  : defaultType === 'ghosting'
                  ? 'Pénalité sévère appliquée'
                  : 'Score de crédibilité réduit'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {defaultType === 'ghosting' 
                  ? 'Vous n\'avez pas pris le client malgré l\'acceptation'
                  : 'Vous avez annulé une réservation acceptée'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Score display */}
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
            <div>
              <p className="text-sm text-muted-foreground">Score actuel</p>
              <p className={cn(
                "text-3xl font-bold",
                (newScore || 100) >= 80 
                  ? "text-green-600" 
                  : (newScore || 100) >= 50 
                  ? "text-amber-600" 
                  : "text-destructive"
              )}>
                {newScore || 100}<span className="text-lg text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pénalité</p>
              <p className="text-xl font-bold text-destructive">
                -{penaltyPoints || 0} pts
              </p>
            </div>
          </div>
          
          {/* Warning messages */}
          {isSuspended && blockedUntil && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-sm text-destructive font-medium">
                ⛔ Votre compte est suspendu jusqu'au {new Date(blockedUntil).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
          
          {schedulingBlocked && !isSuspended && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Vous n'avez plus accès aux demandes de réservation. Seules les courses immédiates sont visibles.
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Améliorez votre score en acceptant et honorant vos courses.
          </p>
          
          <Button 
            onClick={onDismiss}
            variant="outline"
            className="w-full"
          >
            J'ai compris
          </Button>
        </div>
      </div>
    </div>
  );
};
