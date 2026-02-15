import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Hash, 
  Smartphone, 
  Check, 
  Loader2, 
  Copy, 
  Wallet,
  AlertTriangle,
  CreditCard,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { Vehicle } from '@/hooks/useVehicles';

interface BusPaymentMethodsProps {
  vehicle: Vehicle;
  ticketCount: number;
  totalPrice: number;
  onPaymentComplete: (method: string, code?: string) => void;
}

type PaymentMethod = 'qr_code' | 'numeric_code' | 'in_app';

const BusPaymentMethods: React.FC<BusPaymentMethodsProps> = ({
  vehicle,
  ticketCount,
  totalPrice,
  onPaymentComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { availableBalance } = useWallet();

  const hasSufficientBalance = availableBalance >= totalPrice;

  const generateNumericCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateQRData = () => {
    return `LOKEBO-BUS-${vehicle.plate_number}-${Date.now()}-${ticketCount}`;
  };

  const handlePay = async () => {
    if (!selectedMethod) return;
    if (!hasSufficientBalance) {
      toast.error('Solde insuffisant', { description: `Rechargez votre wallet.` });
      return;
    }

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1800));

    let code: string | undefined;
    if (selectedMethod === 'numeric_code') {
      code = generateNumericCode();
      setGeneratedCode(code);
    } else if (selectedMethod === 'qr_code') {
      code = generateQRData();
      setGeneratedCode(code);
    }

    setIsProcessing(false);
    setPaymentDone(true);
    onPaymentComplete(selectedMethod, code);

    toast.success('Paiement validé !', {
      description: `${ticketCount} ticket(s) • ${totalPrice} FCFA`,
    });
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copié !');
    }
  };

  if (paymentDone) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto animate-in zoom-in">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Ticket validé !</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {ticketCount} ticket{ticketCount > 1 ? 's' : ''} • {vehicle.plate_number}
          </p>
        </div>

        {/* Show code/QR for driver validation */}
        {selectedMethod === 'numeric_code' && generatedCode && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Donnez ce code au chauffeur :</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-black tracking-[0.3em] text-primary">{generatedCode}</p>
              <Button size="icon" variant="ghost" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Expire dans 5 minutes</p>
          </div>
        )}

        {selectedMethod === 'qr_code' && generatedCode && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Présentez ce QR code au chauffeur :</p>
            {/* Simulated QR Code */}
            <div className="w-40 h-40 mx-auto bg-white rounded-lg p-2 flex items-center justify-center">
              <div className="w-full h-full border-2 border-foreground rounded grid grid-cols-5 grid-rows-5 gap-[2px] p-1">
                {Array.from({ length: 25 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-sm",
                      Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Code: {generatedCode.slice(-8)}</p>
          </div>
        )}

        {selectedMethod === 'in_app' && (
          <div className="bg-green-500/10 rounded-xl p-4">
            <p className="text-sm text-green-700 font-medium">✅ Validation automatique</p>
            <p className="text-xs text-muted-foreground mt-1">
              Le chauffeur voit votre ticket validé sur son écran
            </p>
          </div>
        )}
      </div>
    );
  }

  const methods: { key: PaymentMethod; icon: typeof QrCode; label: string; desc: string }[] = [
    { key: 'qr_code', icon: QrCode, label: 'QR Code', desc: 'Scannez ou montrez le code' },
    { key: 'numeric_code', icon: Hash, label: 'Code à 6 chiffres', desc: 'Dictez le code au chauffeur' },
    { key: 'in_app', icon: Smartphone, label: 'Paiement in-app', desc: 'Validation automatique' },
  ];

  return (
    <div className="space-y-4">
      {/* Ticket summary */}
      <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-xl p-4 text-center">
        <Ticket className="w-6 h-6 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-black text-primary">{totalPrice} FCFA</p>
        <p className="text-xs text-muted-foreground">
          {ticketCount} ticket{ticketCount > 1 ? 's' : ''} • {vehicle.operator || 'SOCATUR'} • {vehicle.plate_number}
        </p>
      </div>

      {/* Payment method selection */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Choisissez votre mode de paiement</p>
        {methods.map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setSelectedMethod(key)}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
              selectedMethod === key
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
              selectedMethod === key ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            {selectedMethod === key && (
              <Check className="w-5 h-5 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Wallet balance */}
      <div className={cn(
        "flex items-center gap-2 text-sm rounded-xl p-3 border",
        !hasSufficientBalance
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-muted/30 border-transparent text-muted-foreground"
      )}>
        {!hasSufficientBalance ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span>Solde insuffisant : <strong>{availableBalance} FCFA</strong></span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span>Solde : <strong className="text-foreground">{availableBalance} FCFA</strong></span>
          </>
        )}
      </div>

      {/* Pay button */}
      <Button
        className="w-full h-14 rounded-xl font-bold text-base"
        onClick={handlePay}
        disabled={!selectedMethod || isProcessing || !hasSufficientBalance}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Payer {totalPrice} FCFA
          </>
        )}
      </Button>
    </div>
  );
};

export default BusPaymentMethods;
