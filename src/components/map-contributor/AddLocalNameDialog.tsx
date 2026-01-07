import React, { useState } from 'react';
import { MapPin, Camera, Loader2, Check, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddLocalNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinates: { lat: number; lng: number } | null;
  onSubmit: (name: string, photoUrl?: string) => Promise<{ success: boolean; isAlias?: boolean; officialName?: string }>;
}

const AddLocalNameDialog: React.FC<AddLocalNameDialogProps> = ({
  open,
  onOpenChange,
  coordinates,
  onSubmit,
}) => {
  const [localName, setLocalName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isAlias?: boolean; officialName?: string } | null>(null);

  const handleSubmit = async () => {
    if (!localName.trim()) return;

    setIsSubmitting(true);
    const response = await onSubmit(localName.trim(), photoUrl || undefined);
    setIsSubmitting(false);

    if (response.success) {
      if (response.isAlias) {
        setResult({ isAlias: true, officialName: response.officialName });
      } else {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setLocalName('');
    setPhotoUrl('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Ajouter un Nom Local
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {result?.isAlias ? (
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Un lieu existe déjà ici : <strong>{result.officialName}</strong>.
                Votre nom local "{localName}" a été ajouté comme surnom à ce lieu.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {coordinates && (
                <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                  📍 Position : {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="local-name">Comment appelle-t-on cet endroit ?</Label>
                <Input
                  id="local-name"
                  placeholder="Ex: Carrefour Anatole, Poteau Rouge..."
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom sera visible par tous après validation par la communauté
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo-url" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Ajouter une photo (optionnel)
                </Label>
                <Input
                  id="photo-url"
                  placeholder="URL de la photo..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  +20 points bonus si vous ajoutez une photo !
                </p>
              </div>

              <div className="bg-primary/10 rounded-lg p-3 text-sm">
                <p className="font-medium text-primary">🎁 Récompense</p>
                <p className="text-muted-foreground">
                  +50 points après validation par 3 utilisateurs
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result?.isAlias ? 'Fermer' : 'Annuler'}
          </Button>
          {!result?.isAlias && (
            <Button onClick={handleSubmit} disabled={!localName.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocalNameDialog;
