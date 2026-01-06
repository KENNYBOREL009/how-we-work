import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useScheduledTrips, ScheduledTrip } from "@/hooks/useScheduledTrips";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const statusConfig = {
  pending: { 
    label: "En attente", 
    color: "bg-amber-500", 
    textColor: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Clock 
  },
  matched: { 
    label: "Chauffeur trouvé", 
    color: "bg-blue-500", 
    textColor: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: User 
  },
  confirmed: { 
    label: "Confirmé", 
    color: "bg-lokebo-success", 
    textColor: "text-lokebo-success",
    bgColor: "bg-lokebo-success/10",
    borderColor: "border-lokebo-success/30",
    icon: CheckCircle2 
  },
  cancelled: { 
    label: "Annulé", 
    color: "bg-destructive", 
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: XCircle 
  },
  completed: { 
    label: "Terminé", 
    color: "bg-muted-foreground", 
    textColor: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted",
    icon: CheckCircle2 
  },
  no_show_client: { 
    label: "Absent", 
    color: "bg-destructive", 
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: AlertCircle 
  },
  no_show_driver: { 
    label: "Chauffeur absent", 
    color: "bg-destructive", 
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: AlertCircle 
  },
};

const ReservationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scheduledTrips, loading, cancelTrip } = useScheduledTrips();
  const [selectedTrip, setSelectedTrip] = useState<ScheduledTrip | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const upcomingTrips = scheduledTrips.filter(t => 
    ['pending', 'matched', 'confirmed'].includes(t.status) && 
    new Date(t.scheduled_at) > new Date()
  );

  const pastTrips = scheduledTrips.filter(t => 
    ['completed', 'cancelled', 'no_show_client', 'no_show_driver'].includes(t.status) ||
    new Date(t.scheduled_at) <= new Date()
  );

  const handleCancelTrip = async () => {
    if (!selectedTrip) return;
    
    setIsCancelling(true);
    try {
      await cancelTrip(selectedTrip.id, false);
      toast.success("Réservation annulée");
      setShowCancelDialog(false);
      setSelectedTrip(null);
    } catch (error) {
      console.error("Error cancelling trip:", error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsCancelling(false);
    }
  };

  const TripCard = ({ trip }: { trip: ScheduledTrip }) => {
    const status = statusConfig[trip.status];
    const StatusIcon = status.icon;
    const scheduledDate = new Date(trip.scheduled_at);
    const isUpcoming = scheduledDate > new Date();
    const hoursUntil = (scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const willHavePenalty = hoursUntil < 1 && hoursUntil > 0;

    return (
      <div 
        className={cn(
          "p-4 rounded-2xl border-2 transition-all",
          status.bgColor,
          status.borderColor
        )}
      >
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn("gap-1", status.color, "text-white border-0")}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
          <span className="text-sm font-bold">{trip.estimated_fare.toLocaleString()} FCFA</span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">
            {format(scheduledDate, "EEEE dd MMMM", { locale: fr })}
          </span>
          <span className="text-muted-foreground">à</span>
          <span className="font-bold">{format(scheduledDate, "HH:mm")}</span>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="w-2 h-2 rounded-full bg-lokebo-success" />
            <div className="w-0.5 h-6 bg-border" />
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Départ</p>
              <p className="font-medium">{trip.origin}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-medium">{trip.destination}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isUpcoming && trip.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl"
              onClick={() => {
                setSelectedTrip(trip);
                setShowCancelDialog(true);
              }}
            >
              {willHavePenalty ? "Annuler (-500 FCFA)" : "Annuler"}
            </Button>
            {trip.status === 'confirmed' && (
              <Button size="sm" className="flex-1 rounded-xl">
                Contacter
              </Button>
            )}
          </div>
        )}

        {/* Penalty warning */}
        {trip.penalty_amount > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-destructive/10 text-sm text-destructive">
            Pénalité appliquée: {trip.penalty_amount} FCFA
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileLayout>
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedTrip && (() => {
              const hoursUntil = (new Date(selectedTrip.scheduled_at).getTime() - new Date().getTime()) / (1000 * 60 * 60);
              if (hoursUntil < 1) {
                return (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                    <p className="text-destructive font-medium">Attention!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cette annulation entraînera un débit de {selectedTrip.security_deposit} FCFA 
                      car elle intervient moins d'une heure avant le départ.
                    </p>
                  </div>
                );
              }
              return (
                <p className="text-muted-foreground">
                  Voulez-vous vraiment annuler cette réservation? Aucune pénalité ne sera appliquée.
                </p>
              );
            })()}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Retour
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelTrip}
              disabled={isCancelling}
            >
              {isCancelling ? "Annulation..." : "Confirmer l'annulation"}
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
            <h1 className="text-xl font-bold">Mes Réservations</h1>
            <p className="text-sm text-muted-foreground">
              {upcomingTrips.length} course{upcomingTrips.length > 1 ? 's' : ''} à venir
            </p>
          </div>
          <Button 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate("/schedule")}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">À VENIR</h2>
            <div className="space-y-3">
              {upcomingTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {upcomingTrips.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Aucune réservation</h2>
            <p className="text-muted-foreground mb-6">
              Programmez votre prochain taxi à l'avance
            </p>
            <Button onClick={() => navigate("/schedule")} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Programmer une course
            </Button>
          </div>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">HISTORIQUE</h2>
            <div className="space-y-3">
              {pastTrips.slice(0, 5).map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileLayout>
  );
};

export default ReservationsPage;
