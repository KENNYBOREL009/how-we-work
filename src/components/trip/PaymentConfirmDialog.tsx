import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check, Loader2, Banknote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PaymentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'wallet' | 'cash') => Promise<boolean>;
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
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash'>('wallet');

  const hasSufficientBalance = walletBalance >= amount;
  const newBalance = walletBalance - amount;

  const tripLabels = {
    taxi: 'Course Taxi',
    bus: 'Ticket Bus',
    'confort-partage': 'Confort Partagé',
    'privatisation': vehicleClassName ? `VIP ${vehicleClassName}` : 'Course Privée VIP',
  };

  const handleConfirm = async () => {
    // Cash payment always allowed, wallet only if sufficient balance
    if (paymentMethod === 'wallet' && !hasSufficientBalance) return;
    
    setIsProcessing(true);
    const success = await onConfirm(paymentMethod);
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
            {paymentMethod === 'wallet' ? (
              <Wallet className={`w-5 h-5 ${isPrivate ? 'text-amber-500' : 'text-primary'}`} />
            ) : (
              <Banknote className="w-5 h-5 text-green-600" />
            )}
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

          {/* Payment method selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === 'wallet' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <Wallet className={cn(
                  "w-6 h-6",
                  paymentMethod === 'wallet' ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Wallet</span>
                <span className="text-xs text-muted-foreground">
                  {walletBalance.toLocaleString()} FCFA
                </span>
                {!hasSufficientBalance && (
                  <span className="text-xs text-destructive">Insuffisant</span>
                )}
              </button>
              
              <button
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === 'cash' 
                    ? "border-green-500 bg-green-500/5" 
                    : "border-border hover:border-green-500/50"
                )}
              >
                <Banknote className={cn(
                  "w-6 h-6",
                  paymentMethod === 'cash' ? "text-green-600" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Espèces</span>
                <span className="text-xs text-muted-foreground">
                  Payer au chauffeur
                </span>
              </button>
            </div>
          </div>

          {/* Wallet balance info (only for wallet payment) */}
          {paymentMethod === 'wallet' && (
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
          )}

          {/* Cash payment note */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-green-700 dark:text-green-400">
                💵 Préparez {amount.toLocaleString()} FCFA en espèces pour le chauffeur
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="space-y-2">
            <Button
              className={cn(
                "w-full h-14 rounded-xl font-semibold text-lg",
                paymentMethod === 'cash' && "bg-green-600 hover:bg-green-700"
              )}
              onClick={handleConfirm}
              disabled={(paymentMethod === 'wallet' && !hasSufficientBalance) || isProcessing || isSuccess}
            >
              {isSuccess ? (
                <>
                  <Check className="w-6 h-6 mr-2" />
                  Paiement confirmé !
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  {paymentMethod === 'wallet' ? (
                    <Wallet className="w-5 h-5 mr-2" />
                  ) : (
                    <Banknote className="w-5 h-5 mr-2" />
                  )}
                  Confirmer • {amount.toLocaleString()} FCFA
                </>
              )}
            </Button>

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
