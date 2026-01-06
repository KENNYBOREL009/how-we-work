import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Car, Wallet, Shield, ChevronRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgGradient: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: <MapPin className="w-16 h-16" />,
    title: "Trouvez un taxi facilement",
    description: "Visualisez les taxis disponibles en temps réel sur la carte et voyez leur destination affichée.",
    bgGradient: "from-primary/20 to-transparent",
  },
  {
    icon: <Car className="w-16 h-16" />,
    title: "3 modes de transport",
    description: "Réservation classique, Confort Partagé pour diviser les frais, ou Privatisation pour un VTC exclusif.",
    bgGradient: "from-lokebo-success/20 to-transparent",
  },
  {
    icon: <Wallet className="w-16 h-16" />,
    title: "Wallet Transport",
    description: "Gérez votre budget transport, rechargez votre portefeuille et payez sans contact.",
    bgGradient: "from-amber-500/20 to-transparent",
  },
  {
    icon: <Shield className="w-16 h-16" />,
    title: "Voyagez en sécurité",
    description: "Partagez votre trajet, bouton SOS, et chauffeurs vérifiés pour votre tranquillité.",
    bgGradient: "from-blue-500/20 to-transparent",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("lokebo-onboarding-completed", "true");
    navigate("/");
  };

  const handleSkip = () => {
    handleComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="px-6 pt-8 flex items-center justify-between">
        <Logo variant="full" size="sm" />
        {!isLastSlide && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Passer
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Background gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-b pointer-events-none",
          slide.bgGradient
        )} />

        {/* Icon */}
        <div className="relative mb-8 animate-fade-in">
          <div className="w-32 h-32 rounded-3xl bg-card border border-border shadow-elevated flex items-center justify-center text-primary">
            {slide.icon}
          </div>
        </div>

        {/* Text */}
        <div className="relative space-y-4 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">
            {slide.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentSlide 
                ? "w-8 bg-primary" 
                : "w-2 bg-muted hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 safe-bottom">
        <Button 
          className="w-full h-14 text-lg"
          size="lg"
          onClick={handleNext}
        >
          {isLastSlide ? (
            "Commencer"
          ) : (
            <>
              Suivant
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
