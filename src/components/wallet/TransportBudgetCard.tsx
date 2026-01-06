import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Calculator, Calendar, Briefcase, GraduationCap, Plus } from "lucide-react";
import { TransportBudget, CreateBudgetInput, useTransportBudget } from "@/hooks/useTransportBudget";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransportBudgetCardProps {
  activeBudget: TransportBudget | null;
  onCreateBudget: (input: CreateBudgetInput) => Promise<boolean>;
  walletBalance: number;
}

const presets = [
  { label: "Travailleur", icon: Briefcase, dailyCost: 1000, days: 22 },
  { label: "Étudiant", icon: GraduationCap, dailyCost: 500, days: 20 },
];

export const TransportBudgetCard = ({ 
  activeBudget, 
  onCreateBudget,
  walletBalance 
}: TransportBudgetCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dailyCost, setDailyCost] = useState(1000);
  const [workingDays, setWorkingDays] = useState(22);
  const [budgetName, setBudgetName] = useState("Budget Transport");
  const [isCreating, setIsCreating] = useState(false);

  const totalAmount = dailyCost * workingDays;
  const canCreate = totalAmount > 0 && totalAmount <= walletBalance;

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setDailyCost(preset.dailyCost);
    setWorkingDays(preset.days);
    setBudgetName(`Budget ${preset.label}`);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const success = await onCreateBudget({
      name: budgetName,
      daily_cost: dailyCost,
      working_days: workingDays,
    });
    setIsCreating(false);
    if (success) setIsOpen(false);
  };

  // Budget actif - afficher le statut
  if (activeBudget) {
    const daysRemaining = Math.ceil(
      (new Date(activeBudget.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const usedAmount = activeBudget.total_amount - activeBudget.locked_amount;
    const progressPercent = (usedAmount / activeBudget.total_amount) * 100;

    return (
      <div className="p-4 rounded-2xl bg-muted/50 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{activeBudget.name}</h3>
            <p className="text-xs text-muted-foreground">
              {daysRemaining > 0 ? `${daysRemaining} jours restants` : "Expiré"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Verrouillé</span>
            <span className="font-semibold">{activeBudget.locked_amount.toLocaleString()} FCFA</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${100 - progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{activeBudget.daily_cost.toLocaleString()} FCFA/jour</span>
            <span>{activeBudget.working_days} jours</span>
          </div>
        </div>
      </div>
    );
  }

  // Pas de budget actif - afficher le bouton de création
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full p-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Bloquer mon budget transport</h3>
              <p className="text-xs text-muted-foreground">
                Sanctuarisez votre argent pour le mois
              </p>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Créer un budget transport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Presets */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Profil type</Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const PresetIcon = preset.icon;
                const presetTotal = preset.dailyCost * preset.days;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      dailyCost === preset.dailyCost && workingDays === preset.days
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <PresetIcon className="w-5 h-5 mb-1 text-primary" />
                    <p className="font-semibold text-sm">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {presetTotal.toLocaleString()} FCFA/mois
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dailyCost" className="text-xs">Coût journalier (FCFA)</Label>
              <Input
                id="dailyCost"
                type="number"
                value={dailyCost}
                onChange={(e) => setDailyCost(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workingDays" className="text-xs">Jours ouvrés</Label>
              <Input
                id="workingDays"
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                min={1}
                max={31}
                className="mt-1"
              />
            </div>
          </div>

          {/* Calculation */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Calcul automatique</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalAmount.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyCost.toLocaleString()} × {workingDays} jours
            </p>
            {!canCreate && totalAmount > walletBalance && (
              <p className="text-xs text-destructive mt-2">
                Solde insuffisant ({walletBalance.toLocaleString()} FCFA disponible)
              </p>
            )}
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={!canCreate || isCreating}
            className="w-full rounded-xl"
          >
            <Lock className="w-4 h-4 mr-2" />
            {isCreating ? "Création..." : "Bloquer ce montant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
