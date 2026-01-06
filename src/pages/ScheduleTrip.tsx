import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CalendarIcon, 
  MapPin, 
  Clock, 
  Car, 
  Wallet, 
  AlertTriangle,
  CheckCircle2,
  Shield,
  ChevronLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useScheduledTrips, calculateScheduledFare } from "@/hooks/useScheduledTrips";
import { toast } from "sonner";

const ZONES = ["Bonanjo", "Akwa", "Deido", "Kotto", "Makepe", "Bonaberi", "Bepanda", "Ndokoti"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const ScheduleTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { createScheduledTrip } = useScheduledTrips();

  // Form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState("standard");
  const [notes, setNotes] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calculate fare
  const estimatedFare = origin && destination ? calculateScheduledFare(origin, destination, vehicleType) : 0;
  const securityDeposit = 500;
  const totalRequired = estimatedFare + securityDeposit;

  // Check wallet balance
  const walletBalance = wallet?.balance || 0;
  const hasSufficientBalance = walletBalance >= totalRequired;

  const isFormValid = origin && destination && date && time && origin !== destination;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter");
      navigate("/auth");
      return;
    }

    if (!hasSufficientBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    if (!isFormValid || !date) return;

    setIsSubmitting(true);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      await createScheduledTrip(origin, destination, scheduledDate, vehicleType, notes);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/reservations");
      }, 2500);
    } catch (error) {
      console.error("Error creating scheduled trip:", error);
      toast.error("Erreur lors de la création de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-lokebo-success/20 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-lokebo-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Réservation créée!</DialogTitle>
            <p className="text-muted-foreground text-center">
              Nous recherchons un chauffeur disponible pour votre trajet.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Programmer une course</h1>
            <p className="text-sm text-muted-foreground">Réservez votre taxi à l'avance</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-5">
        {/* Wallet Balance Card */}
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all",
          hasSufficientBalance 
            ? "bg-lokebo-success/10 border-lokebo-success/30" 
            : "bg-destructive/10 border-destructive/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                hasSufficientBalance ? "bg-lokebo-success/20" : "bg-destructive/20"
              )}>
                <Wallet className={cn(
                  "w-5 h-5",
                  hasSufficientBalance ? "text-lokebo-success" : "text-destructive"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde disponible</p>
                <p className="font-bold text-lg">{walletBalance.toLocaleString()} FCFA</p>
              </div>
            </div>
            {!hasSufficientBalance && estimatedFare > 0 && (
              <Button variant="outline" size="sm" onClick={() => navigate("/wallet")}>
                Recharger
              </Button>
            )}
          </div>
        </div>

        {/* Origin & Destination */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Point de départ</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="h-12 rounded-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-lokebo-success" />
                  <SelectValue placeholder="Sélectionnez votre quartier" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ZONES.map(zone => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="h-12 rounded-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Sélectionnez votre destination" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ZONES.filter(z => z !== origin).map(zone => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Date</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal rounded-xl",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd MMM", { locale: fr }) : "Choisir"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Heure</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="h-12 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <SelectValue placeholder="Heure" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {HOURS.map(hour => (
                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Type */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Type de véhicule</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVehicleType("standard")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                vehicleType === "standard" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <Car className="w-6 h-6 mb-2" />
              <p className="font-semibold">Standard</p>
              <p className="text-xs text-muted-foreground">Taxi classique</p>
            </button>
            <button
              type="button"
              onClick={() => setVehicleType("confort")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                vehicleType === "confort" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <Car className="w-6 h-6 mb-2 text-primary" />
              <p className="font-semibold">Confort</p>
              <p className="text-xs text-muted-foreground">Climatisé +50%</p>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Notes (optionnel)</Label>
          <Textarea
            placeholder="Instructions spéciales pour le chauffeur..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl resize-none"
            rows={2}
          />
        </div>

        {/* Price Summary */}
        {estimatedFare > 0 && (
          <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Course estimée</span>
              <span className="font-semibold">{estimatedFare.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dépôt de garantie</span>
              <span className="font-semibold">{securityDeposit.toLocaleString()} FCFA</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-bold">Total requis</span>
              <span className="font-bold text-lg text-primary">{totalRequired.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Balance Warning */}
        {!hasSufficientBalance && estimatedFare > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-600">Solde insuffisant</p>
                <p className="text-muted-foreground">
                  Pour programmer ce taxi, votre solde doit couvrir le montant de la course + marge de sécurité. 
                  Veuillez recharger votre compte.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Penalty Warning */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Politique d'annulation</p>
              <p>
                Toute annulation moins d'une heure avant le départ entraînera un débit forfaitaire 
                de {securityDeposit} FCFA de votre solde.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-border bg-background">
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl"
          onClick={handleSubmit}
          disabled={!isFormValid || !hasSufficientBalance || isSubmitting}
        >
          {isSubmitting ? (
            "Création en cours..."
          ) : (
            <>Valider la demande - {estimatedFare.toLocaleString()} FCFA</>
          )}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ScheduleTrip;
