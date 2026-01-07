import { cn } from '@/lib/utils';
import { Check, Armchair, Users, Sparkles } from 'lucide-react';

export type SeatPreference = 'any' | 'front' | 'back-alone';

interface SeatOption {
  id: SeatPreference;
  label: string;
  description: string;
  icon: typeof Armchair;
  extraPrice: number;
  available: boolean;
}

const seatOptions: SeatOption[] = [
  {
    id: 'any',
    label: 'Peu importe',
    description: 'Prix standard',
    icon: Users,
    extraPrice: 0,
    available: true,
  },
  {
    id: 'front',
    label: 'Place Avant',
    description: 'Confort supplémentaire',
    icon: Armchair,
    extraPrice: 500,
    available: true,
  },
  {
    id: 'back-alone',
    label: 'Banquette seule',
    description: 'Si disponible',
    icon: Sparkles,
    extraPrice: 1000,
    available: false, // Simulé comme non disponible
  },
];

interface SeatPreferenceSelectorProps {
  selected: SeatPreference;
  onSelect: (preference: SeatPreference) => void;
  className?: string;
}

export const SeatPreferenceSelector = ({
  selected,
  onSelect,
  className,
}: SeatPreferenceSelectorProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Armchair className="w-4 h-4 text-violet-500" />
        <h3 className="font-semibold text-sm">Préférence de place</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {seatOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          const isDisabled = !option.available;
          
          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && onSelect(option.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all",
                isSelected
                  ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : isDisabled
                    ? "border-muted bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                    : "border-border bg-card hover:border-violet-500/50 cursor-pointer"
              )}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              <Icon className={cn(
                "w-4 h-4",
                isSelected ? "text-violet-500" : "text-muted-foreground"
              )} />
              
              <div className="text-left">
                <span className="text-sm font-medium">{option.label}</span>
                {option.extraPrice > 0 && (
                  <span className={cn(
                    "ml-1.5 text-xs",
                    isSelected ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                  )}>
                    +{option.extraPrice}F
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Description de l'option sélectionnée */}
      <p className="text-xs text-muted-foreground pl-1">
        {seatOptions.find(o => o.id === selected)?.description}
      </p>
    </div>
  );
};

export const getSeatExtraPrice = (preference: SeatPreference): number => {
  return seatOptions.find(o => o.id === preference)?.extraPrice || 0;
};
