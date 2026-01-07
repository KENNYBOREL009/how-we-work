import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Fuel, Wrench, Shield, ParkingCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDriverExpenses } from '@/hooks/useDriverExpenses';
import type { ExpenseType } from '@/types';

const EXPENSE_TYPES: { value: ExpenseType; label: string; icon: typeof Fuel }[] = [
  { value: 'fuel', label: 'Carburant', icon: Fuel },
  { value: 'maintenance', label: 'Entretien', icon: Wrench },
  { value: 'insurance', label: 'Assurance', icon: Shield },
  { value: 'parking', label: 'Parking', icon: ParkingCircle },
  { value: 'other', label: 'Autre', icon: Plus },
];

interface QuickExpenseButtonProps {
  fleetVehicleId?: string;
  onExpenseAdded?: () => void;
}

export const QuickExpenseButton = ({
  fleetVehicleId,
  onExpenseAdded,
}: QuickExpenseButtonProps) => {
  const [open, setOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>('fuel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createExpense } = useDriverExpenses();

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({
        expense_type: expenseType,
        amount: Number(amount),
        description: description || undefined,
        fleet_vehicle_id: fleetVehicleId,
      });

      toast.success('Dépense enregistrée');
      setOpen(false);
      setAmount('');
      setDescription('');
      onExpenseAdded?.();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = EXPENSE_TYPES.find((t) => t.value === expenseType)?.icon || Fuel;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Dépense
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SelectedIcon className="w-5 h-5 text-primary" />
            Ajouter une dépense
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type de dépense</Label>
            <Select
              value={expenseType}
              onValueChange={(v) => setExpenseType(v as ExpenseType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              placeholder="Ex: 20 litres Super"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !amount}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
