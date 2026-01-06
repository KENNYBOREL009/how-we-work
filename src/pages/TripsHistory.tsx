import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  History, 
  MapPin, 
  Calendar,
  Clock,
  Car,
  Bus,
  ChevronRight,
  Filter,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  trip_type: string;
  origin: string | null;
  destination: string | null;
  fare: number | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const tripTypeLabels: Record<string, { label: string; icon: typeof Car; color: string }> = {
  "ligne-visuelle": { label: "Ligne Visuelle", icon: Car, color: "bg-lokebo-success" },
  "reservation": { label: "Réservation", icon: Calendar, color: "bg-primary" },
  "confort-partage": { label: "Confort Partagé", icon: Car, color: "bg-lokebo-warning" },
  "privatisation": { label: "Privatisation", icon: Car, color: "bg-lokebo-dark" },
  "bus": { label: "Bus", icon: Bus, color: "bg-blue-500" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-lokebo-warning" },
  active: { label: "En cours", color: "text-blue-500" },
  completed: { label: "Terminé", color: "text-lokebo-success" },
  cancelled: { label: "Annulé", color: "text-destructive" },
};

const TripsHistory = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "taxi" | "bus">("all");

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trips:", error);
      } else {
        setTrips(data || []);
      }
      setIsLoading(false);
    };

    fetchTrips();
  }, [user]);

  const filteredTrips = trips.filter(trip => {
    if (filter === "all") return true;
    if (filter === "bus") return trip.trip_type === "bus";
    return trip.trip_type !== "bus";
  });

  const totalSpent = trips
    .filter(t => t.status === "completed" && t.fare)
    .reduce((sum, t) => sum + (t.fare || 0), 0);

  const completedTrips = trips.filter(t => t.status === "completed").length;

  return (
    <MobileLayout>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-lokebo-dark flex items-center justify-center">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
            <p className="text-sm text-muted-foreground">
              Vos trajets passés
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Total dépensé</p>
            <p className="text-lg font-bold text-foreground">
              {totalSpent.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Trajets terminés</p>
            <p className="text-lg font-bold text-foreground">
              {completedTrips} <span className="text-sm font-normal text-muted-foreground">trajets</span>
            </p>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1 flex flex-col px-4">
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Filter className="w-4 h-4" />
            Tous
          </TabsTrigger>
          <TabsTrigger value="taxi" className="flex items-center gap-1.5">
            <Car className="w-4 h-4" />
            Taxis
          </TabsTrigger>
          <TabsTrigger value="bus" className="flex items-center gap-1.5">
            <Bus className="w-4 h-4" />
            Bus
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="flex-1 mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aucun trajet</h3>
              <p className="text-sm text-muted-foreground">
                Vos trajets apparaîtront ici
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pb-4">
                {filteredTrips.map((trip) => {
                  const typeInfo = tripTypeLabels[trip.trip_type] || tripTypeLabels["ligne-visuelle"];
                  const statusInfo = statusLabels[trip.status] || statusLabels.pending;
                  const Icon = typeInfo.icon;

                  return (
                    <div
                      key={trip.id}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          typeInfo.color,
                          trip.trip_type === "privatisation" ? "text-primary" : "text-white"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground text-sm">
                              {typeInfo.label}
                            </h3>
                            <span className={cn("text-xs font-medium", statusInfo.color)}>
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {trip.origin || "Position"} → {trip.destination || "Destination"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(trip.created_at), "d MMM", { locale: fr })}
                              </span>
                              {trip.started_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(trip.started_at), "HH:mm")}
                                </span>
                              )}
                            </div>
                            {trip.fare && (
                              <span className="font-semibold text-foreground text-sm">
                                {trip.fare.toLocaleString()} FCFA
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
};

export default TripsHistory;
