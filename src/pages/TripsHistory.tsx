import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  History, 
  MapPin, 
  Calendar,
  Clock,
  Car,
  Bus,
  ChevronLeft,
  Loader2,
  TrendingUp,
  Receipt,
  Star,
  Users,
  Crown
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
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
  driver_rating: number | null;
}

const tripTypeConfig: Record<string, { label: string; icon: typeof Car; color: string; bgColor: string }> = {
  "reservation": { 
    label: "Réservation", 
    icon: Calendar, 
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  "confort-partage": { 
    label: "Confort Partagé", 
    icon: Users, 
    color: "text-violet-500",
    bgColor: "bg-violet-500/10"
  },
  "privatisation": { 
    label: "Privatisation", 
    icon: Crown, 
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  "bus": { 
    label: "Bus", 
    icon: Bus, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "En attente", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  active: { label: "En cours", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  completed: { label: "Terminé", color: "text-lokebo-success", bgColor: "bg-lokebo-success/10" },
  cancelled: { label: "Annulé", color: "text-destructive", bgColor: "bg-destructive/10" },
};

const TripsHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "taxi" | "bus">("all");
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) {
        // Demo data for non-authenticated users
        setTrips([
          {
            id: "1",
            trip_type: "reservation",
            origin: "Akwa",
            destination: "Bonanjo",
            fare: 1500,
            status: "completed",
            started_at: new Date(Date.now() - 86400000).toISOString(),
            completed_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
            created_at: new Date(Date.now() - 86400000).toISOString(),
            driver_rating: 5,
          },
          {
            id: "2",
            trip_type: "confort-partage",
            origin: "Ndokoti",
            destination: "Akwa Palace",
            fare: 800,
            status: "completed",
            started_at: new Date(Date.now() - 172800000).toISOString(),
            completed_at: new Date(Date.now() - 172800000 + 2400000).toISOString(),
            created_at: new Date(Date.now() - 172800000).toISOString(),
            driver_rating: 4,
          },
          {
            id: "3",
            trip_type: "privatisation",
            origin: "Bonanjo",
            destination: "Aéroport",
            fare: 5000,
            status: "completed",
            started_at: new Date(Date.now() - 604800000).toISOString(),
            completed_at: new Date(Date.now() - 604800000 + 3600000).toISOString(),
            created_at: new Date(Date.now() - 604800000).toISOString(),
            driver_rating: 5,
          },
        ]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

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

  // Stats calculations
  const thisMonth = trips.filter(t => {
    const tripDate = new Date(t.created_at);
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return tripDate >= start && tripDate <= end;
  });

  const lastMonth = trips.filter(t => {
    const tripDate = new Date(t.created_at);
    const start = startOfMonth(subMonths(new Date(), 1));
    const end = endOfMonth(subMonths(new Date(), 1));
    return tripDate >= start && tripDate <= end;
  });

  const thisMonthSpent = thisMonth
    .filter(t => t.status === "completed" && t.fare)
    .reduce((sum, t) => sum + (t.fare || 0), 0);

  const lastMonthSpent = lastMonth
    .filter(t => t.status === "completed" && t.fare)
    .reduce((sum, t) => sum + (t.fare || 0), 0);

  const totalSpent = trips
    .filter(t => t.status === "completed" && t.fare)
    .reduce((sum, t) => sum + (t.fare || 0), 0);

  const completedTrips = trips.filter(t => t.status === "completed").length;
  const spentDiff = thisMonthSpent - lastMonthSpent;

  return (
    <MobileLayout showThemeToggle={false}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Historique</h1>
          <p className="text-sm text-muted-foreground">{completedTrips} trajets effectués</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowStats(!showStats)}
          className={cn(showStats && "bg-muted")}
        >
          <TrendingUp className="w-5 h-5" />
        </Button>
      </header>

      {/* Stats Panel */}
      {showStats && (
        <div className="px-4 mb-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-lokebo-dark to-gray-900 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/70">Ce mois-ci</p>
                <p className="text-2xl font-bold">
                  {thisMonthSpent.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1",
                spentDiff > 0 ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
              )}>
                <TrendingUp className={cn("w-3 h-3", spentDiff < 0 && "rotate-180")} />
                {Math.abs(spentDiff).toLocaleString()} FCFA
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs text-white/60 mb-1">Total</p>
                <p className="font-bold">{totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs text-white/60 mb-1">Trajets</p>
                <p className="font-bold">{completedTrips}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs text-white/60 mb-1">Moyenne</p>
                <p className="font-bold">{completedTrips > 0 ? Math.round(totalSpent / completedTrips).toLocaleString() : 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1 flex flex-col px-4">
        <TabsList className="grid grid-cols-3 mb-4 h-12">
          <TabsTrigger value="all" className="gap-2">
            <Receipt className="w-4 h-4" />
            Tous
          </TabsTrigger>
          <TabsTrigger value="taxi" className="gap-2">
            <Car className="w-4 h-4" />
            Taxi
          </TabsTrigger>
          <TabsTrigger value="bus" className="gap-2">
            <Bus className="w-4 h-4" />
            Bus
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="flex-1 mt-0 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                <History className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Aucun trajet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Vos trajets apparaîtront ici après votre première course
              </p>
              <Button onClick={() => navigate("/signal")}>
                Réserver une course
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredTrips.map((trip) => {
                const typeConfig = tripTypeConfig[trip.trip_type] || tripTypeConfig["reservation"];
                const statusCfg = statusConfig[trip.status] || statusConfig.pending;
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={trip.id}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        typeConfig.bgColor
                      )}>
                        <Icon className={cn("w-6 h-6", typeConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">
                            {typeConfig.label}
                          </h3>
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            statusCfg.bgColor,
                            statusCfg.color
                          )}>
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {trip.origin || "Départ"} → {trip.destination || "Destination"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(trip.created_at), "d MMM", { locale: fr })}
                            </span>
                            {trip.started_at && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(trip.started_at), "HH:mm")}
                              </span>
                            )}
                            {trip.driver_rating && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {trip.driver_rating}
                              </span>
                            )}
                          </div>
                          {trip.fare && (
                            <span className="font-bold text-foreground">
                              {trip.fare.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
};

export default TripsHistory;
