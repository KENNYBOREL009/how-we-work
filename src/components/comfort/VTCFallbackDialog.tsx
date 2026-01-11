import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Car, Users, Clock, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

interface VTCFallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharedPrice: number;
  vtcPrice: number;
  destination: string;
  reason?: 'no_match' | 'timeout' | 'no_passengers';
  onAcceptVTC: () => void;
  onRetryShared: () => void;
  onCancel: () => void;
}

export const VTCFallbackDialog = ({
  open,
  onOpenChange,
  sharedPrice,
  vtcPrice,
  destination,
  reason = 'no_match',
  onAcceptVTC,
  onRetryShared,
  onCancel
}: VTCFallbackDialogProps) => {
  const [loading, setLoading] = useState(false);

  const reasonMessages = {
    no_match: "Aucun véhicule compatible trouvé dans votre direction pour le moment.",
    timeout: "Le temps de recherche a expiré sans trouver de correspondance.",
    no_passengers: "Pas d'autres passagers allant dans cette direction actuellement."
  };

  const handleAcceptVTC = async () => {
    setLoading(true);
    await onAcceptVTC();
    setLoading(false);
  };

  const priceDifference = vtcPrice - sharedPrice;
  const percentageIncrease = Math.round((priceDifference / sharedPrice) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">
            Trajet partagé indisponible
          </DialogTitle>
          <DialogDescription className="text-center">
            {reasonMessages[reason]}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* VTC Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-2 border-violet-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Basculer en VTC privé</p>
                <p className="text-xs text-muted-foreground">Véhicule dédié, sans attente</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-violet-600">{vtcPrice.toLocaleString()} FCFA</p>
                <p className="text-xs text-muted-foreground">+{percentageIncrease}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Départ immédiat</span>
              <ArrowRight className="w-4 h-4 mx-1" />
              <span>{destination}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span>Véhicule confort</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Users className="w-4 h-4 text-violet-500" />
              <span>Trajet privé</span>
            </div>
          </div>

          {/* Price comparison */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix partagé estimé</span>
              <span className="line-through">{sharedPrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Prix VTC</span>
              <span className="text-violet-600">{vtcPrice.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={handleAcceptVTC}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Recherche d'un VTC...</span>
            ) : (
              <>
                <Car className="w-5 h-5 mr-2" />
                Commander un VTC
              </>
            )}
          </Button>

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onRetryShared}
            >
              <Users className="w-4 h-4 mr-2" />
              Réessayer partagé
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={onCancel}
            >
              Annuler
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
