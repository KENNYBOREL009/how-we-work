import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  Mail,
  Globe,
  Star,
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const links = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Conditions d'utilisation",
      href: "#terms",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Politique de confidentialité",
      href: "#privacy",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Nous contacter",
      href: "mailto:contact@lokebo.com",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: "Site web",
      href: "https://lokebo.com",
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Noter l'application",
      href: "#rate",
    },
  ];

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
          <h1 className="text-xl font-bold">Informations</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-6 space-y-8">
        {/* Logo & Version */}
        <div className="flex flex-col items-center py-8">
          <Logo variant="full" size="lg" />
          <p className="text-sm text-muted-foreground mt-4">Version 1.0.0</p>
        </div>

        {/* Description */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">À propos de Lokebo</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lokebo est votre application de mobilité urbaine au Cameroun. 
            Réservez un taxi, partagez une course, ou programmez vos trajets 
            en toute simplicité. Notre mission est de rendre le transport 
            urbain plus accessible, sûr et abordable pour tous.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => {
                if (link.href.startsWith("http") || link.href.startsWith("mailto")) {
                  window.open(link.href, "_blank");
                }
              }}
            >
              <span className="flex items-center gap-3">
                <span className="text-muted-foreground">{link.icon}</span>
                {link.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-muted-foreground">
            © 2024 Lokebo. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fait avec ❤️ au Cameroun
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default About;
