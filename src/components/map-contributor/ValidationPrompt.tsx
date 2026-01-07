import React, { useState } from 'react';
import { MapPin, Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MapContribution } from '@/hooks/useMapContributions';

interface ValidationPromptProps {
  contribution: MapContribution;
  distance_m: number;
  onVote: (vote: 'yes' | 'no' | 'unknown') => Promise<boolean>;
  onDismiss: () => void;
}

const ValidationPrompt: React.FC<ValidationPromptProps> = ({
  contribution,
  distance_m,
  onVote,
  onDismiss,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(false);

  const handleVote = async (vote: 'yes' | 'no' | 'unknown') => {
    setIsVoting(true);
    const success = await onVote(vote);
    setIsVoting(false);
    
    if (success) {
      setVoted(true);
      setTimeout(onDismiss, 1500);
    }
  };

  if (voted) {
    return (
      <div className="fixed bottom-28 left-4 right-4 z-50 animate-in slide-in-from-bottom">
        <div className="bg-emerald-500 text-white rounded-xl p-4 shadow-xl flex items-center gap-3">
          <Check className="w-5 h-5" />
          <span className="font-medium">+5 points ! Merci pour votre validation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-28 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <div className="bg-background border border-border rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {contribution.contribution_type === 'local_name' && (
                <>Confirmez-vous que ce lieu s'appelle "{contribution.local_name}" ?</>
              )}
              {contribution.contribution_type === 'error_report' && (
                <>Confirmez-vous cette erreur signalée ?</>
              )}
              {contribution.contribution_type === 'road_trace' && (
                <>Confirmez-vous cette nouvelle route ?</>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              📍 À {Math.round(distance_m)} m de vous
            </p>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleVote('no')}
            disabled={isVoting}
          >
            <X className="w-4 h-4 mr-1" />
            Non
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleVote('unknown')}
            disabled={isVoting}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Je ne sais pas
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => handleVote('yes')}
            disabled={isVoting}
          >
            {isVoting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Oui
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Gagnez +5 points pour chaque validation
        </p>
      </div>
    </div>
  );
};

export default ValidationPrompt;
