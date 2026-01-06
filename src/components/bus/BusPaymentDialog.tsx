import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

interface BusPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  routeName: string;
  fare: number;
  walletBalance: number;
}

export const BusPaymentDialog = ({
  open,
  onClose,
  onConfirm,
  routeName,
  fare,
  walletBalance,
}: BusPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasSufficientBalance = walletBalance >= fare;

  const handleConfirm = async () => {
    if (!hasSufficientBalance) return;
    
    setIsProcessing(true);
    const success = await onConfirm();
    setIsProcessing(false);
    
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-lokebo-dark" />
            Ticket de Bus
          </DialogTitle>
          <DialogDescription>
            Ligne: {routeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Ticket validé !</h3>
              <p className="text-muted-foreground">
                Bon voyage sur la ligne {routeName}
              </p>
            </div>
          ) : (
            <>
              {/* Ticket visuel */}
              <div className="relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />
                
                <div className="bg-lokebo-dark text-primary-foreground rounded-2xl p-6 text-center border-2 border-dashed border-primary/30">
                  <p className="text-sm opacity-80 mb-1">Tarif du trajet</p>
                  <p className="text-4xl font-bold text-primary">
                    {fare.toLocaleString()} <span className="text-xl">FCFA</span>
                  </p>
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <p className="text-xs opacity-60">LOKEBO • SOCATUR</p>
                  </div>
                </div>
              </div>

              {/* Solde */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50 text-sm">
                <span className="text-muted-foreground">Solde wallet</span>
                <span className={`font-semibold ${hasSufficientBalance ? '' : 'text-destructive'}`}>
                  {walletBalance.toLocaleString()} FCFA
                </span>
              </div>

              {!hasSufficientBalance && (
                <p className="text-sm text-destructive text-center">
                  Solde insuffisant. Rechargez votre wallet.
                </p>
              )}

              {/* Actions */}
              <Button
                className="w-full h-14 rounded-xl font-semibold bg-lokebo-dark hover:bg-lokebo-dark/90"
                onClick={handleConfirm}
                disabled={!hasSufficientBalance || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payer {fare.toLocaleString()} FCFA
                  </>
                )}
              </Button>

              <button
                onClick={onClose}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
