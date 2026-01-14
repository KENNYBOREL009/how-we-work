import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingGuideContextValue {
  isActive: boolean;
  currentStep: number;
  steps: GuideStep[];
  startGuide: (steps: GuideStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endGuide: () => void;
  skipGuide: () => void;
}

const OnboardingGuideContext = createContext<OnboardingGuideContextValue | null>(null);

export const useOnboardingGuide = () => {
  const context = useContext(OnboardingGuideContext);
  if (!context) {
    throw new Error('useOnboardingGuide must be used within OnboardingGuideProvider');
  }
  return context;
};

interface OnboardingGuideProviderProps {
  children: ReactNode;
}

export const OnboardingGuideProvider = ({ children }: OnboardingGuideProviderProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GuideStep[]>([]);

  const startGuide = (guideSteps: GuideStep[]) => {
    setSteps(guideSteps);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endGuide();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const endGuide = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    localStorage.setItem('lokebo-guide-completed', 'true');
  };

  const skipGuide = () => {
    localStorage.setItem('lokebo-guide-skipped', 'true');
    endGuide();
  };

  return (
    <OnboardingGuideContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startGuide,
        nextStep,
        prevStep,
        endGuide,
        skipGuide,
      }}
    >
      {children}
      {isActive && <GuideOverlay />}
    </OnboardingGuideContext.Provider>
  );
};

const GuideOverlay = () => {
  const { steps, currentStep, nextStep, prevStep, skipGuide } = useOnboardingGuide();
  const step = steps[currentStep];

  if (!step) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100]" />

      {/* Guide Card */}
      <Card className="fixed bottom-20 left-4 right-4 z-[101] p-4 shadow-2xl animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <Button variant="ghost" size="icon" onClick={skipGuide} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    idx <= currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </span>
              <Button size="sm" onClick={nextStep}>
                {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

// Predefined guide steps for different user types
export const clientGuideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur Lokebo ! 👋',
    description: 'Découvrez comment trouver un taxi facilement. Ce guide vous accompagne pas à pas.',
  },
  {
    id: 'map',
    title: 'La carte en temps réel',
    description: 'Visualisez les taxis disponibles autour de vous. Les icônes jaunes sont des taxis libres.',
    targetSelector: '#main-map',
  },
  {
    id: 'signal',
    title: 'Signalez votre position',
    description: 'Appuyez ici pour signaler que vous cherchez un taxi. Les chauffeurs à proximité seront notifiés.',
    targetSelector: '#signal-button',
  },
  {
    id: 'book',
    title: 'Réservez une course',
    description: 'Choisissez votre destination et le type de course : classique, confort partagé ou VTC privatisé.',
    targetSelector: '#book-button',
  },
  {
    id: 'voice',
    title: 'Utilisez votre voix 🎤',
    description: 'Appuyez sur le micro pour dicter votre destination au lieu de taper !',
  },
  {
    id: 'wallet',
    title: 'Votre portefeuille',
    description: 'Gérez votre budget transport, rechargez et payez sans contact.',
    targetSelector: '#wallet-nav',
  },
];

export const driverGuideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue Chauffeur ! 🚕',
    description: 'Ce guide vous montre comment utiliser l\'application efficacement.',
  },
  {
    id: 'online',
    title: 'Passez en ligne',
    description: 'Activez votre statut pour commencer à recevoir des demandes de course.',
    targetSelector: '#online-toggle',
  },
  {
    id: 'destination',
    title: 'Affichez votre direction',
    description: 'Indiquez où vous allez pour attirer les passagers qui vont dans la même direction.',
    targetSelector: '#destination-selector',
  },
  {
    id: 'voice-control',
    title: 'Contrôle vocal 🎤',
    description: 'Dites "Accepter" ou "Refuser" pour gérer les courses sans toucher votre téléphone.',
  },
  {
    id: 'seats',
    title: 'Gérez vos places',
    description: 'Indiquez combien de places sont disponibles pour le mode confort partagé.',
    targetSelector: '#seat-counter',
  },
];
