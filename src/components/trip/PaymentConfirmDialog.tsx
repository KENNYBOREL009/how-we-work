import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PaymentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  amount: number;
  walletBalance: number;
  tripType: 'taxi' | 'bus' | 'confort-partage' | 'privatisation';
  destination: string;
  isPrivate?: boolean;
  vehicleClassName?: string;
}

export const PaymentConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  amount,
  walletBalance,
  tripType,
  destination,
  isPrivate = false,
  vehicleClassName,
}: PaymentConfirmDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasSufficientBalance = walletBalance >= amount;
  const newBalance = walletBalance - amount;

  const tripLabels = {
    taxi: 'Course Taxi',
    bus: 'Ticket Bus',
    'confort-partage': 'Confort Partagé',
    'privatisation': vehicleClassName ? `VIP ${vehicleClassName}` : 'Course Privée VIP',
  };

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
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className={`w-5 h-5 ${isPrivate ? 'text-amber-500' : 'text-primary'}`} />
            Confirmer le paiement
          </DialogTitle>
          <DialogDescription>
            {tripLabels[tripType]} vers {destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Montant */}
          <div className={`text-center p-6 rounded-2xl border ${
            isPrivate 
              ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
              : 'bg-primary/10 border-primary/20'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
            <p className={`text-4xl font-bold ${isPrivate ? 'text-amber-500' : 'text-primary'}`}>
              {amount.toLocaleString()} <span className="text-xl">FCFA</span>
            </p>
            {isPrivate && vehicleClassName && (
              <p className="text-xs text-amber-600 mt-2">✨ Service {vehicleClassName}</p>
            )}
          </div>

          {/* Solde wallet */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
            <div>
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className="font-semibold">{walletBalance.toLocaleString()} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Après paiement</p>
              <p className={`font-semibold ${hasSufficientBalance ? 'text-foreground' : 'text-destructive'}`}>
                {hasSufficientBalance ? `${newBalance.toLocaleString()} FCFA` : 'Insuffisant'}
              </p>
            </div>
          </div>

          {/* Avertissement solde insuffisant */}
          {!hasSufficientBalance && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Solde insuffisant</p>
                <p className="text-sm text-muted-foreground">
                  Rechargez votre wallet de {(amount - walletBalance).toLocaleString()} FCFA minimum
                </p>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="space-y-2">
            <Button
              className="w-full h-14 rounded-xl font-semibold text-lg"
              onClick={handleConfirm}
              disabled={!hasSufficientBalance || isProcessing || isSuccess}
            >
              {isSuccess ? (
                <>
                  <Check className="w-6 h-6 mr-2" />
                  Paiement réussi !
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Confirmer - {amount.toLocaleString()} FCFA
                </>
              )}
            </Button>

            {!hasSufficientBalance && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => {
                  onClose();
                  // Navigation vers recharge wallet
                }}
              >
                Recharger mon wallet
              </Button>
            )}

            <button
              onClick={onClose}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
              disabled={isProcessing}
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
