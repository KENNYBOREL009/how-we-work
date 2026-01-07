import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Car, MapPin } from "lucide-react";

interface CancellationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
  penaltyAmount: number;
  driverMadeDetour: boolean;
  driverDistance?: number; // in meters
}

export const CancellationWarningDialog = ({
  open,
  onOpenChange,
  onConfirmCancel,
  penaltyAmount,
  driverMadeDetour,
  driverDistance = 200,
}: CancellationWarningDialogProps) => {
  const isDriverClose = driverDistance < 500;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Confirmer l'annulation ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Driver status */}
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Le chauffeur est en route</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    À {driverDistance}m de vous
                  </p>
                </div>
              </div>

              {/* Penalty explanation */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-destructive text-center text-lg">
                  Pénalité : {penaltyAmount} FCFA
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  {driverMadeDetour ? (
                    <>
                      <strong className="text-destructive">Pénalité complète :</strong> Le chauffeur a fait un détour pour vous.
                    </>
                  ) : (
                    <>
                      <strong className="text-amber-600">Frais d'attente :</strong> Le chauffeur a modifié son itinéraire.
                    </>
                  )}
                </p>
              </div>

              {/* Warning text */}
              <p className="text-xs text-center text-muted-foreground">
                Ce montant sera prélevé de votre portefeuille. 
                {driverMadeDetour 
                  ? " Il sera versé au chauffeur en compensation."
                  : " 50% sera versé au chauffeur, 50% sera remboursé."
                }
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <AlertDialogCancel className="w-full">
            Revenir à la course
          </AlertDialogCancel>
          <AlertDialogAction 
            className="w-full bg-destructive hover:bg-destructive/90"
            onClick={onConfirmCancel}
          >
            Annuler et payer {penaltyAmount} FCFA
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
