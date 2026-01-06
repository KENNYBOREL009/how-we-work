import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, Loader2 } from "lucide-react";
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
}

const quickComments = [
  "Conduite agréable",
  "Véhicule propre",
  "Ponctuel",
  "Sympathique",
  "Bon itinéraire",
];

export const RateDriverDialog = ({
  open,
  onClose,
  onSubmit,
  driverName,
  plateNumber,
}: RateDriverDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedQuickComments, setSelectedQuickComments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickComment = (quickComment: string) => {
    setSelectedQuickComments(prev => 
      prev.includes(quickComment)
        ? prev.filter(c => c !== quickComment)
        : [...prev, quickComment]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    const fullComment = [...selectedQuickComments, comment].filter(Boolean).join(". ");
    await onSubmit(rating, fullComment);
    setIsSubmitting(false);
    onClose();
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Comment était votre course ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver info */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-primary">
                {plateNumber.slice(0, 2)}
              </span>
            </div>
            <p className="font-semibold">{driverName || plateNumber}</p>
          </div>

          {/* Star rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 5 && "Excellent ! 🎉"}
              {rating === 4 && "Très bien 👍"}
              {rating === 3 && "Correct"}
              {rating === 2 && "Peut mieux faire"}
              {rating === 1 && "Décevant 😔"}
            </p>
          )}

          {/* Quick comments */}
          <div className="flex flex-wrap gap-2 justify-center">
            {quickComments.map((qc) => (
              <button
                key={qc}
                onClick={() => handleQuickComment(qc)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  selectedQuickComments.includes(qc)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {qc}
              </button>
            ))}
          </div>

          {/* Comment textarea */}
          <Textarea
            placeholder="Ajouter un commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Submit */}
          <Button
            className="w-full h-12 rounded-xl font-semibold"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ThumbsUp className="w-5 h-5 mr-2" />
                Envoyer
              </>
            )}
          </Button>

          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Ignorer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
