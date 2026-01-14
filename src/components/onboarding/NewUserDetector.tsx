import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles, BookOpen, X } from 'lucide-react';
import { useOnboardingGuide, clientGuideSteps, driverGuideSteps } from './OnboardingGuide';

interface NewUserDetectorProps {
  userType?: 'client' | 'driver';
}

export const NewUserDetector = ({ userType = 'client' }: NewUserDetectorProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { startGuide } = useOnboardingGuide();

  useEffect(() => {
    const guideCompleted = localStorage.getItem('lokebo-guide-completed');
    const guideSkipped = localStorage.getItem('lokebo-guide-skipped');
    const onboardingCompleted = localStorage.getItem('lokebo-onboarding-completed');

    // Show prompt if user completed onboarding but hasn't done the interactive guide
    if (onboardingCompleted && !guideCompleted && !guideSkipped) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartGuide = () => {
    setShowPrompt(false);
    const steps = userType === 'driver' ? driverGuideSteps : clientGuideSteps;
    startGuide(steps);
  };

  const handleSkip = () => {
    setShowPrompt(false);
    localStorage.setItem('lokebo-guide-skipped', 'true');
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Petit tour guidé ?</h2>
          <p className="text-muted-foreground mb-6">
            Découvrez les fonctionnalités clés en 1 minute pour profiter pleinement de Lokebo.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleStartGuide} className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Oui, montrez-moi !
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
