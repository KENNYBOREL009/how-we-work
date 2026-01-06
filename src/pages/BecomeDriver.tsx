import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Car,
  Wallet,
  Clock,
  Users,
  Shield,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const benefits = [
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Revenus flexibles",
    description: "Gagnez de l'argent selon votre propre emploi du temps",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Horaires libres",
    description: "Travaillez quand vous voulez, autant que vous voulez",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Grande communauté",
    description: "Rejoignez des milliers de chauffeurs partenaires",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Assurance incluse",
    description: "Protection complète pendant vos courses",
  },
];

const requirements = [
  "Permis de conduire valide (catégorie B minimum)",
  "Véhicule en bon état de moins de 10 ans",
  "Casier judiciaire vierge",
  "Carte grise à votre nom ou autorisation du propriétaire",
  "Assurance véhicule à jour",
];

const BecomeDriver = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout showThemeToggle={false}>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Devenir chauffeur</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="px-4 py-8 text-center bg-gradient-to-b from-primary/10 to-transparent">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Roulez avec Lokebo</h2>
          <p className="text-muted-foreground text-sm">
            Gagnez de l'argent en conduisant dans votre ville
          </p>
        </div>

        {/* Benefits */}
        <div className="px-4 py-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Avantages</h3>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-muted/50 border border-border space-y-2"
              >
                <div className="text-primary">{benefit.icon}</div>
                <h4 className="font-semibold text-sm">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="px-4 py-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Conditions requises</h3>
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="px-4 py-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Comment ça marche ?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Inscrivez-vous</h4>
                <p className="text-xs text-muted-foreground">Remplissez le formulaire en ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Vérification</h4>
                <p className="text-xs text-muted-foreground">Nous vérifions vos documents</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Commencez à rouler</h4>
                <p className="text-xs text-muted-foreground">Activez votre compte et gagnez !</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border bg-background">
        <Button className="w-full h-14 rounded-xl text-lg font-semibold">
          <Car className="w-5 h-5 mr-2" />
          Commencer l'inscription
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Inscription gratuite • Activation sous 48h
        </p>
      </div>
    </MobileLayout>
  );
};

export default BecomeDriver;
