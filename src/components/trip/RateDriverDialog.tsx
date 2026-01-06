import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RateDriverDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  driverName: string;
  plateNumber: string;
  destination?: string;
  fare?: number;
}

const quickComments = [
  { emoji: "🚗", text: "Conduite douce" },
  { emoji: "✨", text: "Véhicule propre" },
  { emoji: "⏰", text: "Ponctuel" },
  { emoji: "😊", text: "Sympathique" },
  { emoji: "🗺️", text: "Bon itinéraire" },
  { emoji: "🎵", text: "Bonne ambiance" },
];

export const RateDriverDialog = ({
  open,
  onClose,
  onSubmit,
  driverName,
  plateNumber,
  destination,
  fare,
}: RateDriverDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedQuickComments, setSelectedQuickComments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickComment = (text: string) => {
    setSelectedQuickComments(prev => 
      prev.includes(text)
        ? prev.filter(c => c !== text)
        : [...prev, text]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    const fullComment = [...selectedQuickComments, comment].filter(Boolean).join(". ");
    await onSubmit(rating, fullComment);
    setIsSubmitting(false);
    
    // Reset state
    setRating(0);
    setComment("");
    setSelectedQuickComments([]);
    onClose();
  };

  const displayRating = hoveredRating || rating;

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return { text: "Excellent !", color: "text-lokebo-success" };
      case 4: return { text: "Très bien", color: "text-primary" };
      case 3: return { text: "Correct", color: "text-muted-foreground" };
      case 2: return { text: "Peut mieux faire", color: "text-amber-500" };
      case 1: return { text: "Décevant", color: "text-destructive" };
      default: return { text: "Évaluez votre course", color: "text-muted-foreground" };
    }
  };

  const ratingLabel = getRatingLabel(displayRating);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm mx-4 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Course terminée !
            </DialogTitle>
          </DialogHeader>

          {/* Driver info card */}
          <div className="mt-4 p-4 bg-card rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{driverName || "Chauffeur"}</p>
                <p className="text-sm text-muted-foreground">{plateNumber}</p>
              </div>
              {fare && (
                <div className="text-right">
                  <p className="font-bold text-foreground">{fare.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
              )}
            </div>
            {destination && (
              <p className="mt-3 text-sm text-muted-foreground truncate">
                → {destination}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Star rating */}
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-11 h-11 transition-all duration-200",
                      star <= displayRating
                        ? "fill-primary text-primary"
                        : "text-muted/50"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn("text-sm font-medium transition-colors", ratingLabel.color)}>
              {ratingLabel.text}
            </p>
          </div>

          {/* Quick comments - only show after rating */}
          {rating > 0 && (
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Qu&apos;avez-vous apprécié ?
              </p>
              <div className="flex flex-wrap gap-2">
                {quickComments.map((qc) => (
                  <button
                    key={qc.text}
                    onClick={() => handleQuickComment(qc.text)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5",
                      selectedQuickComments.includes(qc.text)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span>{qc.emoji}</span>
                    <span>{qc.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment textarea - only show after rating */}
          {rating > 0 && (
            <div className="animate-fade-in">
              <Textarea
                placeholder="Ajouter un commentaire (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none min-h-[80px]"
                rows={3}
              />
            </div>
          )}

          {/* Submit */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full h-13"
              size="lg"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer mon avis
                </>
              )}
            </Button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer cette étape
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
