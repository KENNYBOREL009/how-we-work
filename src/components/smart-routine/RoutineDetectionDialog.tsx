import React, { useState } from 'react';
import { Car, MapPin, Clock, Calendar, Check, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoutineDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: string;
  destination: string;
  tripCount: number;
  typicalTime?: string;
  onConfirm: () => Promise<boolean>;
  onDecline: () => void;
}

const RoutineDetectionDialog: React.FC<RoutineDetectionDialogProps> = ({
  open,
  onOpenChange,
  origin,
  destination,
  tripCount,
  typicalTime,
  onConfirm,
  onDecline,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    const success = await onConfirm();
    setIsConfirming(false);
    
    if (success) {
      setIsActivated(true);
    }
  };

  const handleClose = () => {
    setIsActivated(false);
    onOpenChange(false);
  };

  if (isActivated) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Routine activée ! 🎉</h3>
            <p className="text-muted-foreground">
              Les chauffeurs de votre zone seront prévenus de votre trajet habituel.
            </p>
            <Button className="mt-6" onClick={handleClose}>
              Parfait !
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDecline(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            C'est votre trajet pour le travail ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5" />
              <div>
                <div className="text-xs text-muted-foreground">Départ</div>
                <div className="font-medium">{origin}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
              <div>
                <div className="text-xs text-muted-foreground">Arrivée</div>
                <div className="font-medium">{destination}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{tripCount} fois ce mois</span>
            </div>
            {typicalTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Vers {typicalTime}</span>
              </div>
            )}
          </div>

          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">
              Voulez-vous qu'on prévienne les chauffeurs de votre zone pour demain ?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vous ne réservez pas, mais vous signalez votre intention. Plus de taxis seront disponibles !
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onDecline}>
            <X className="w-4 h-4 mr-2" />
            Non merci
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Activer ma Routine
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineDetectionDialog;
