import { useState, useEffect } from "react";
import { AlertTriangle, X, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PenaltyNotificationProps {
  penaltyAmount: number;
  reason: "no_show" | "cancellation";
  driverMadeDetour: boolean;
  onClose: () => void;
  onViewWallet: () => void;
}

export const PenaltyNotification = ({
  penaltyAmount,
  reason,
  driverMadeDetour,
  onClose,
  onViewWallet,
}: PenaltyNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const reasonText = reason === "no_show" 
    ? "Absence au point de ramassage" 
    : "Annulation de course";

  const detourExplanation = driverMadeDetour
    ? "Pénalité complète appliquée : Le chauffeur a fait un détour pour vous."
    : "Frais d'attente débités. Le chauffeur a patienté pour vous.";

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className={cn(
        "bg-card border border-destructive/30 rounded-2xl w-full max-w-sm shadow-2xl transition-all duration-300",
        isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
      )}>
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-destructive">Pénalité appliquée</h2>
              <p className="text-sm text-muted-foreground">{reasonText}</p>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="px-6 py-4 bg-destructive/5 border-y border-destructive/20">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Montant débité</span>
            <span className="text-2xl font-bold text-destructive">
              -{penaltyAmount} FCFA
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground text-center">
              {detourExplanation}
            </p>
          </div>

          {/* Distribution info */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            {driverMadeDetour ? (
              <p>100% versé au chauffeur (compensation carburant)</p>
            ) : (
              <>
                <p>50% versé au chauffeur (temps perdu)</p>
                <p>50% frais de service</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
            >
              Fermer
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={onViewWallet}
            >
              <Wallet className="h-4 w-4" />
              Voir solde
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
