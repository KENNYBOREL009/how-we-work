import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Car, Users, Sparkles, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

type InterfaceLevel = 'classic' | 'standard' | 'complete';

interface InterfaceOption {
  id: InterfaceLevel;
  label: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  color: string;
}

const INTERFACE_OPTIONS: InterfaceOption[] = [
  {
    id: 'classic',
    label: 'Classique',
    description: 'Taxi collectif simplifié',
    route: '/driver/classic',
    icon: <Car className="w-5 h-5" />,
    color: 'bg-amber-500',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Confort partagé',
    route: '/driver',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-blue-500',
  },
  {
    id: 'complete',
    label: 'Complet',
    description: 'VTC Premium + AI',
    route: '/driver-v2',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-purple-500',
  },
];

const STORAGE_KEY = 'driver_interface_level';

export const useInterfaceLevel = () => {
  const [level, setLevel] = useState<InterfaceLevel>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as InterfaceLevel) || 'standard';
    }
    return 'standard';
  });

  const saveLevel = (newLevel: InterfaceLevel) => {
    setLevel(newLevel);
    localStorage.setItem(STORAGE_KEY, newLevel);
  };

  return { level, setLevel: saveLevel };
};

interface InterfaceLevelSelectorProps {
  compact?: boolean;
  onSelect?: (level: InterfaceLevel) => void;
}

export const InterfaceLevelSelector = ({ 
  compact = false,
  onSelect 
}: InterfaceLevelSelectorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { level, setLevel } = useInterfaceLevel();

  // Determine current level from route
  const getCurrentLevel = (): InterfaceLevel => {
    if (location.pathname === '/driver/classic') return 'classic';
    if (location.pathname === '/driver-v2') return 'complete';
    return 'standard';
  };

  const currentLevel = getCurrentLevel();

  const handleSelect = (option: InterfaceOption) => {
    setLevel(option.id);
    onSelect?.(option.id);
    if (location.pathname !== option.route) {
      navigate(option.route);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-1 bg-muted rounded-full p-1">
        {INTERFACE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              currentLevel === option.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full', option.color)} />
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        Choisir mon interface
      </h3>
      <div className="grid gap-2">
        {INTERFACE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
              currentLevel === option.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-white',
              option.color
            )}>
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
            {currentLevel === option.id && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
