import React, { useState } from 'react';
import { AlertTriangle, Loader2, Check, Construction, ArrowRightCircle, XCircle, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ErrorType = 'road_blocked' | 'one_way' | 'non_existent' | 'other';

interface ErrorOption {
  type: ErrorType;
  icon: React.ElementType;
  label: string;
  description: string;
}

const errorOptions: ErrorOption[] = [
  { type: 'road_blocked', icon: Construction, label: 'Route barrée', description: 'Travaux, obstacle permanent' },
  { type: 'one_way', icon: ArrowRightCircle, label: 'Sens unique', description: 'Direction non indiquée sur la carte' },
  { type: 'non_existent', icon: XCircle, label: 'Inexistant', description: 'Cette route n\'existe pas' },
  { type: 'other', icon: HelpCircle, label: 'Autre erreur', description: 'Problème différent' },
];

interface ReportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinates: { lat: number; lng: number } | null;
  onSubmit: (errorType: ErrorType, description?: string) => Promise<boolean>;
}

const ReportErrorDialog: React.FC<ReportErrorDialogProps> = ({
  open,
  onOpenChange,
  coordinates,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<ErrorType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    const success = await onSubmit(selectedType, description || undefined);
    setIsSubmitting(false);

    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Signaler une Erreur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {coordinates && (
            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              📍 Position : {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </div>
          )}

          <div className="space-y-2">
            <Label>Type d'erreur</Label>
            <div className="grid grid-cols-2 gap-2">
              {errorOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    selectedType === option.type
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <option.icon className={cn(
                    'w-6 h-6',
                    selectedType === option.type ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="text-center">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="space-y-2">
              <Label htmlFor="description">Détails (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez le problème..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <div className="bg-primary/10 rounded-lg p-3 text-sm">
            <p className="font-medium text-primary">🎁 Récompense</p>
            <p className="text-muted-foreground">
              +30 points après validation par 3 utilisateurs
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedType || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Signaler
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportErrorDialog;
