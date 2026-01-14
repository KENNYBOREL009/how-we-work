import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Gift, X, ChevronRight, Sparkles, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ContributionPromptProps {
  onOpenContributor?: () => void;
  className?: string;
}

/**
 * A non-intrusive prompt to encourage users to contribute local names
 * Shows after a trip or at key moments
 */
export const ContributionPrompt = ({ onOpenContributor, className }: ContributionPromptProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={cn(
      "p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-emerald-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
              Aidez-nous à améliorer la carte !
            </h4>
            <button 
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Connaissez-vous des noms locaux de lieux ? Partagez-les et gagnez des récompenses !
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={onOpenContributor}
            >
              <Gift className="w-4 h-4 mr-1" />
              Contribuer (+50 pts)
            </Button>
            <button 
              className="text-xs text-emerald-600 hover:underline flex items-center"
              onClick={() => setDismissed(true)}
            >
              Plus tard
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dialog version of the contribution prompt - shown after trips
 */
interface ContributionPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
}

export const ContributionPromptDialog = ({ 
  isOpen, 
  onClose,
  destinationName 
}: ContributionPromptDialogProps) => {
  const navigate = useNavigate();

  const handleContribute = () => {
    onClose();
    navigate('/rewards', { state: { openContributor: true } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2">
            <Map className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            Merci pour votre trajet !
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4 py-2">
          <p className="text-muted-foreground">
            {destinationName 
              ? `Connaissez-vous un nom local pour "${destinationName}" ou les lieux autour ?`
              : "Connaissez-vous des noms locaux des lieux visités ?"
            }
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Gagnez 50 points Lokebo
                </p>
                <p className="text-xs text-muted-foreground">
                  Pour chaque contribution validée
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Aidez-nous à mieux vous servir
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleContribute}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Contribuer maintenant
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Peut-être plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Mini floating badge to remind about contributions
 */
export const ContributionReminder = ({ 
  onOpen, 
  className 
}: { 
  onOpen: () => void; 
  className?: string;
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-emerald-500 text-white text-sm font-medium",
        "shadow-lg hover:shadow-xl transition-all hover:scale-105",
        "animate-fade-in",
        className
      )}
    >
      <MapPin className="w-4 h-4" />
      <span>Enrichir la carte</span>
      <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">+50</span>
    </button>
  );
};
