import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Clock, 
  Users, 
  MapPin, 
  Star, 
  Shield, 
  TrendingDown,
  Check,
  X,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchedDriver {
  id: string;
  name: string;
  rating: number;
  photo?: string;
  vehicleModel: string;
  plateNumber: string;
  eta: number; // minutes
}

interface ComfortMatchResultProps {
  driver: MatchedDriver;
  currentPassengers: number;
  originalPrice: number;
  sharedPrice: number;
  pickupLocation: string;
  destination: string;
  detourMinutes?: number;
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
}

export const ComfortMatchResult = ({
  driver,
  currentPassengers,
  originalPrice,
  sharedPrice,
  pickupLocation,
  destination,
  detourMinutes = 0,
  onAccept,
  onDecline,
  className,
}: ComfortMatchResultProps) => {
  const [countdown, setCountdown] = useState(30);
  const savingsPercent = Math.round(((originalPrice - sharedPrice) / originalPrice) * 100);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  return (
    <Card className={cn(
      "overflow-hidden border-violet-500/30 bg-gradient-to-b from-violet-500/5 to-background",
      className
    )}>
      {/* Header avec compte à rebours */}
      <div className="relative px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-violet-700 dark:text-violet-300">Trajet trouvé !</p>
              <p className="text-xs text-muted-foreground">Répondez dans {countdown}s</p>
            </div>
          </div>
          
          {/* Timer circulaire */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={100}
                strokeDashoffset={100 - (countdown / 30) * 100}
                className="text-violet-500 transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {countdown}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Chauffeur */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {driver.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold">{driver.name}</p>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-medium">{driver.rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{driver.vehicleModel}</p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Arrive dans {driver.eta} min
              </span>
            </div>
          </div>
        </div>

        {/* Info Co-passagers (anonymisé) */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {currentPassengers > 0 
                ? `${currentPassengers} personne${currentPassengers > 1 ? 's' : ''} déjà à bord`
                : 'Vous serez le premier passager'
              }
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Identités protégées</span>
            </div>
          </div>
        </div>

        {/* Trajet */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Point de ramassage</p>
                <p className="text-sm font-medium">{pickupLocation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium">{destination}</p>
              </div>
            </div>
          </div>
          
          {detourMinutes > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
              <Navigation className="w-3.5 h-3.5" />
              <span>Détour de ~{detourMinutes} min pour vous récupérer</span>
            </div>
          )}
        </div>

        {/* Prix */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prix partagé</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {sharedPrice.toLocaleString()} F
                </p>
                <p className="text-sm line-through text-muted-foreground">
                  {originalPrice.toLocaleString()} F
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-bold">-{savingsPercent}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={onDecline}
          >
            <X className="w-4 h-4 mr-2" />
            Refuser
          </Button>
          <Button
            className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            onClick={onAccept}
          >
            <Check className="w-4 h-4 mr-2" />
            Accepter
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Composant pour la recherche en cours
export const ComfortSearching = ({ 
  destination,
  onCancel 
}: { 
  destination: string;
  onCancel: () => void;
}) => {
  const [dots, setDots] = useState('');
  const [searchPhase, setSearchPhase] = useState(0);

  const phases = [
    'Recherche de véhicules sur votre axe',
    'Analyse des trajets compatibles',
    'Calcul du meilleur tarif',
    'Optimisation du parcours'
  ];

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const phaseInterval = setInterval(() => {
      setSearchPhase(prev => (prev + 1) % phases.length);
    }, 2500);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(phaseInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Radar animation */}
      <div className="relative w-40 h-40 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
        <div className="absolute inset-4 rounded-full border-2 border-violet-500/30" />
        <div className="absolute inset-8 rounded-full border border-violet-500/40" />
        
        {/* Sweep animation */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.3) 60deg, transparent 120deg)',
            animation: 'spin 2s linear infinite',
          }}
        />
        
        {/* Center car icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Car className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Blinking dots representing potential matches */}
        <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-violet-400 animate-ping" />
        <div className="absolute bottom-8 left-4 w-2 h-2 rounded-full bg-violet-400 animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-12 left-6 w-2 h-2 rounded-full bg-violet-400 animate-ping" style={{ animationDelay: '1s' }} />
      </div>

      {/* Search status */}
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-lg font-bold text-violet-700 dark:text-violet-300">
          Recherche intelligente{dots}
        </h3>
        <p className="text-sm text-muted-foreground animate-pulse">
          {phases[searchPhase]}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <MapPin className="w-3.5 h-3.5 text-violet-500" />
          <span>Vers {destination}</span>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-1.5 mb-8">
        {phases.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-8 h-1 rounded-full transition-colors duration-300",
              idx <= searchPhase ? "bg-violet-500" : "bg-muted"
            )}
          />
        ))}
      </div>

      <Button variant="outline" onClick={onCancel} className="text-muted-foreground">
        Annuler la recherche
      </Button>
    </div>
  );
};
