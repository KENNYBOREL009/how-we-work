import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Car
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriverAvailability, getDayName } from "@/hooks/useDriverAvailability";
import { useScheduledTrips, ScheduledTrip } from "@/hooks/useScheduledTrips";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ZONES = ["Bonanjo", "Akwa", "Deido", "Kotto", "Makepe", "Bonaberi", "Bepanda", "Ndokoti"];
const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const DriverPlanning = () => {
  const navigate = useNavigate();
  const { 
    availability, 
    reliabilityScore, 
    addAvailability, 
    removeAvailability,
    loading 
  } = useDriverAvailability();
  const { pendingOffers, acceptTrip } = useScheduledTrips();

  // Add availability form
  const [showAddModal, setShowAddModal] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [originZone, setOriginZone] = useState("");
  const [destinationZone, setDestinationZone] = useState("");
  const [vehicleType, setVehicleType] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Offer acceptance
  const [selectedOffer, setSelectedOffer] = useState<ScheduledTrip | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAddAvailability = async () => {
    if (dayOfWeek === null || !startTime || !endTime || !originZone) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsSubmitting(true);
    try {
      await addAvailability(dayOfWeek, startTime, endTime, originZone, destinationZone, vehicleType);
      toast.success("Créneau ajouté");
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error adding availability:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;

    setIsAccepting(true);
    try {
      await acceptTrip(selectedOffer.id);
      toast.success("Course acceptée!", {
        description: `${selectedOffer.origin} → ${selectedOffer.destination}`
      });
      setSelectedOffer(null);
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Erreur lors de l'acceptation");
    } finally {
      setIsAccepting(false);
    }
  };

  const resetForm = () => {
    setDayOfWeek(null);
    setStartTime("");
    setEndTime("");
    setOriginZone("");
    setDestinationZone("");
    setVehicleType("standard");
  };

  // Group availability by day
  const availabilityByDay = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, typeof availability>);

  return (
    <MobileLayout>
      {/* Add Availability Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Jour de la semaine</Label>
              <Select value={dayOfWeek?.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un jour" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">De</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Début" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map(hour => (
                      <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">À</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map(hour => (
                      <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Zone de départ</Label>
              <Select value={originZone} onValueChange={setOriginZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Où serez-vous?" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Direction préférée (optionnel)</Label>
              <Select value={destinationZone} onValueChange={setDestinationZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes directions</SelectItem>
                  {ZONES.filter(z => z !== originZone).map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Type de véhicule</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleType("standard")}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    vehicleType === "standard" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <Car className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType("confort")}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    vehicleType === "confort" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <Car className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <span className="text-sm font-medium">Confort</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddAvailability} disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Offer Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opportunité de course</DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {format(new Date(selectedOffer.scheduled_at), "EEEE dd MMMM 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 py-1">
                    <div className="w-2 h-2 rounded-full bg-lokebo-success" />
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Départ</p>
                      <p className="font-medium">{selectedOffer.origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{selectedOffer.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Tarif estimé</span>
                <span className="text-xl font-bold text-primary">
                  {selectedOffer.estimated_fare.toLocaleString()} FCFA
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  En acceptant, vous vous engagez à être présent. Un no-show affectera votre score.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedOffer(null)}>
              Refuser
            </Button>
            <Button onClick={handleAcceptOffer} disabled={isAccepting}>
              {isAccepting ? "Acceptation..." : "Accepter la course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Mon Planning</h1>
            <p className="text-sm text-muted-foreground">Gérez vos disponibilités</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
        {/* Reliability Score Card */}
        {reliabilityScore && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Score de Fiabilité
              </h3>
              <span className={cn(
                "text-2xl font-bold",
                reliabilityScore.reliability_score >= 80 ? "text-lokebo-success" :
                reliabilityScore.reliability_score >= 50 ? "text-amber-500" : "text-destructive"
              )}>
                {reliabilityScore.reliability_score}%
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Taux d'acceptation</span>
                  <span className="font-medium">{reliabilityScore.acceptance_rate}%</span>
                </div>
                <Progress value={reliabilityScore.acceptance_rate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Ponctualité</span>
                  <span className="font-medium">{reliabilityScore.punctuality_score}%</span>
                </div>
                <Progress value={reliabilityScore.punctuality_score} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Courses effectuées</span>
                <span className="font-medium">{reliabilityScore.completed_trips}/{reliabilityScore.total_scheduled_trips}</span>
              </div>
            </div>

            {reliabilityScore.is_scheduling_blocked && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive font-medium">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Accès aux réservations programmées bloqué
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pending Offers */}
        {pendingOffers.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              OPPORTUNITÉS ({pendingOffers.length})
            </h2>
            <div className="space-y-2">
              {pendingOffers.slice(0, 3).map(offer => (
                <button
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
                  className="w-full p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-left hover:bg-amber-500/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-amber-600">
                      {format(new Date(offer.scheduled_at), "dd MMM HH:mm", { locale: fr })}
                    </span>
                    <Badge className="bg-amber-500 text-white">
                      {offer.estimated_fare.toLocaleString()} FCFA
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-lokebo-success" />
                    <span>{offer.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{offer.destination}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* My Availability */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              MES CRÉNEAUX
            </h2>
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-xl"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {availability.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun créneau défini</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos disponibilités pour recevoir des offres
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(availabilityByDay).map(([day, slots]) => (
                <div key={day} className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-3">{getDayName(parseInt(day))}</h3>
                  <div className="space-y-2">
                    {slots.map(slot => (
                      <div 
                        key={slot.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="font-medium">{slot.start_time}</span>
                            <span className="text-muted-foreground"> - </span>
                            <span className="font-medium">{slot.end_time}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {slot.origin_zone}
                            {slot.destination_zone && ` → ${slot.destination_zone}`}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAvailability(slot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileLayout>
  );
};

export default DriverPlanning;
