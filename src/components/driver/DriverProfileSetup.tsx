import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Building2, Wallet, Percent, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DriverProfile, EmploymentType, PaymentModel } from '@/hooks/useDriverProfile';
import { toast } from 'sonner';

interface DriverProfileSetupProps {
  onComplete: (profile: Partial<DriverProfile>) => void;
}

export const DriverProfileSetup = ({ onComplete }: DriverProfileSetupProps) => {
  const [step, setStep] = useState(1);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('owner');
  const [paymentModel, setPaymentModel] = useState<PaymentModel>(null);
  const [dailyRentalAmount, setDailyRentalAmount] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const handleSubmit = () => {
    const profile: Partial<DriverProfile> = {
      employmentType,
      paymentModel: employmentType === 'employee' ? paymentModel : null,
      dailyRentalAmount: paymentModel === 'daily_rental' ? parseInt(dailyRentalAmount) || 0 : 0,
      commissionRate: paymentModel === 'commission' ? parseInt(commissionRate) || 0 : 0,
      fleetOwnerName: employmentType === 'employee' ? ownerName : null,
      fleetOwnerPhone: employmentType === 'employee' ? ownerPhone : null,
      assignedVehiclePlate: vehiclePlate || null,
      isConfigured: true,
    };

    onComplete(profile);
    toast.success('Profil configuré !', {
      description: 'Vous pouvez maintenant commencer à travailler.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Configurons votre profil</h1>
        <p className="text-muted-foreground mt-2">
          Étape {step} sur {employmentType === 'employee' ? 3 : 2}
        </p>
      </div>

      {/* Step 1: Employment Type */}
      {step === 1 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-lg">Quel est votre statut ?</h2>
          
          <RadioGroup 
            value={employmentType} 
            onValueChange={(v) => setEmploymentType(v as EmploymentType)}
            className="space-y-3"
          >
            <Card 
              className={`cursor-pointer transition-all ${employmentType === 'owner' ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => setEmploymentType('owner')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="owner" id="owner" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      <Label htmlFor="owner" className="font-semibold cursor-pointer">
                        Je possède mon véhicule
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vous gardez 100% de vos gains. Gérez vos propres dépenses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${employmentType === 'employee' ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => setEmploymentType('employee')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="employee" id="employee" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <Label htmlFor="employee" className="font-semibold cursor-pointer">
                        Je travaille pour un propriétaire
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Location quotidienne ou commission sur vos courses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>

          <div className="pt-4">
            <Button 
              className="w-full h-14 text-lg"
              onClick={() => setStep(employmentType === 'employee' ? 2 : 3)}
            >
              Continuer
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment Model (Employee only) */}
      {step === 2 && employmentType === 'employee' && (
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-lg">Modèle de paiement</h2>
          
          <Select value={paymentModel || ''} onValueChange={(v) => setPaymentModel(v as PaymentModel)}>
            <SelectTrigger className="h-14">
              <SelectValue placeholder="Choisir le modèle..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily_rental">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>Location quotidienne</span>
                </div>
              </SelectItem>
              <SelectItem value="commission">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <span>Commission sur courses</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {paymentModel === 'daily_rental' && (
            <div className="space-y-2">
              <Label>Montant de location quotidienne</Label>
              <div className="relative">
                <Input 
                  type="number"
                  placeholder="15000"
                  value={dailyRentalAmount}
                  onChange={(e) => setDailyRentalAmount(e.target.value)}
                  className="h-14 text-lg pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>
          )}

          {paymentModel === 'commission' && (
            <div className="space-y-2">
              <Label>Taux de commission</Label>
              <div className="relative">
                <Input 
                  type="number"
                  placeholder="20"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="h-14 text-lg pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom du propriétaire</Label>
            <Input 
              placeholder="Nom ou société"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="h-14"
            />
          </div>

          <div className="space-y-2">
            <Label>Téléphone du propriétaire</Label>
            <Input 
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="h-14"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 h-14"
              onClick={() => setStep(1)}
            >
              Retour
            </Button>
            <Button 
              className="flex-1 h-14"
              onClick={() => setStep(3)}
              disabled={!paymentModel}
            >
              Continuer
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Vehicle Info */}
      {step === 3 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-lg">Informations véhicule</h2>
          
          <div className="space-y-2">
            <Label>Plaque d'immatriculation</Label>
            <Input 
              placeholder="LT 000 XX"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              className="h-14 text-lg uppercase"
            />
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-medium">Récapitulatif</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span>{employmentType === 'owner' ? 'Propriétaire' : 'Employé'}</span>
                </div>
                {employmentType === 'employee' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modèle</span>
                      <span>{paymentModel === 'daily_rental' ? 'Location' : 'Commission'}</span>
                    </div>
                    {paymentModel === 'daily_rental' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location/jour</span>
                        <span>{parseInt(dailyRentalAmount).toLocaleString()} FCFA</span>
                      </div>
                    )}
                    {paymentModel === 'commission' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission</span>
                        <span>{commissionRate}%</span>
                      </div>
                    )}
                  </>
                )}
                {vehiclePlate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Véhicule</span>
                    <span>{vehiclePlate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 h-14"
              onClick={() => setStep(employmentType === 'employee' ? 2 : 1)}
            >
              Retour
            </Button>
            <Button 
              className="flex-1 h-14 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="mr-2 w-5 h-5" />
              Terminer
            </Button>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-4">
        {[1, 2, 3].map((s) => {
          const isVisible = employmentType === 'employee' || s !== 2;
          if (!isVisible) return null;
          return (
            <div 
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                step >= s ? 'bg-primary w-6' : 'bg-muted'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
