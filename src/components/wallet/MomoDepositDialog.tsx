import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useMobileMoney } from "@/hooks/useMobileMoney";

interface MomoDepositDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

export const MomoDepositDialog = ({ open, onClose, onSuccess }: MomoDepositDialogProps) => {
  const { initiateDeposit, isProcessing } = useMobileMoney();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success' | 'error'>('input');

  const handlePresetAmount = (preset: number) => {
    setAmount(preset);
  };

  const handleSubmit = async () => {
    if (!phoneNumber || amount < 100) return;

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setStep('processing');
    
    const result = await initiateDeposit(phoneNumber, amount);
    
    if (result) {
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } else {
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('input');
    setPhoneNumber("");
    setAmount(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <span>Dépôt MTN Mobile Money</span>
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro MTN MoMo</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="6XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Vous recevrez une demande de paiement sur ce numéro
              </p>
            </div>

            <div className="space-y-3">
              <Label>Montant (FCFA)</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetAmount(preset)}
                  >
                    {preset.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Autre montant"
                value={amount || ''}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="text-lg"
                min={100}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={!phoneNumber || amount < 100}
            >
              Continuer
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 py-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numéro</span>
                <span className="font-medium">{phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-lg">{amount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais</span>
                <span className="text-green-600">Gratuit</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Après confirmation, vous recevrez une notification USSD sur votre téléphone. 
                Entrez votre code PIN MTN pour valider le paiement.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('input')}>
                Modifier
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Confirmer
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-yellow-500" />
            <div>
              <p className="font-medium text-lg">Demande envoyée</p>
              <p className="text-muted-foreground">
                Vérifiez votre téléphone et entrez votre code PIN
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p>📱 Une notification USSD a été envoyée au</p>
              <p className="font-medium">{phoneNumber}</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <p className="font-medium text-lg">Dépôt réussi !</p>
              <p className="text-2xl font-bold text-green-600">
                +{amount.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <div>
              <p className="font-medium text-lg">Échec du dépôt</p>
              <p className="text-muted-foreground">
                Le paiement n'a pas pu être complété
              </p>
            </div>
            <Button onClick={() => setStep('input')} variant="outline">
              Réessayer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
