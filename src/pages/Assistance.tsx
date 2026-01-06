import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Send,
  MessageCircle,
  HelpCircle,
  CreditCard,
  Car,
  MapPin,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "Comment réserver un taxi ?",
    answer: "Appuyez sur 'Lancer un Signal' depuis l'accueil, entrez votre destination, choisissez le mode de trajet et confirmez.",
    icon: <Car className="w-5 h-5" />,
  },
  {
    id: "2",
    question: "Comment fonctionne le paiement ?",
    answer: "Vous pouvez payer en espèces au chauffeur ou utiliser votre portefeuille Lokebo. Rechargez votre portefeuille depuis la section Wallet.",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "3",
    question: "Comment programmer une course ?",
    answer: "Depuis l'accueil, appuyez sur 'Programmer' et sélectionnez la date, l'heure et la destination souhaitées.",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "4",
    question: "Comment modifier ma destination ?",
    answer: "Pendant une course active, vous pouvez modifier votre destination en communiquant directement avec le chauffeur.",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: "5",
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui, toutes vos données personnelles sont cryptées et sécurisées. Nous ne partageons jamais vos informations sans votre consentement.",
    icon: <Shield className="w-5 h-5" />,
  },
];

const Assistance = () => {
  const navigate = useNavigate();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Pour l'instant, juste un placeholder
    setMessage("");
  };

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
          <div>
            <h1 className="text-xl font-bold">Assistance</h1>
            <p className="text-xs text-muted-foreground">Comment pouvons-nous vous aider ?</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-xl"
            onClick={() => window.open("tel:+237600000000")}
          >
            <MessageCircle className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Appeler le support</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-xl"
            onClick={() => window.open("mailto:support@lokebo.com")}
          >
            <HelpCircle className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Envoyer un email</span>
          </Button>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Questions fréquentes</h2>
          <div className="space-y-2">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{item.icon}</div>
                    <span className="text-sm font-medium">{item.question}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedFAQ === item.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedFAQ === item.id && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground pl-8">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Posez votre question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-full"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Réponse sous 24h • support@lokebo.com
        </p>
      </div>
    </MobileLayout>
  );
};

export default Assistance;
