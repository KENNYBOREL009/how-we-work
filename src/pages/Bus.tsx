import MobileLayout from "@/components/layout/MobileLayout";
import { Bus, MapPin, Clock, Bell, List, Map as MapIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BusMap from "@/components/map/BusMap";
import SchedulePanel from "@/components/bus/SchedulePanel";
import BusList from "@/components/bus/BusList";
import BusDetailDrawer from "@/components/bus/BusDetailDrawer";
import { useVehicles, Vehicle, BusStop } from "@/hooks/useVehicles";
import { useBusSchedule } from "@/hooks/useBusSchedule";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

const BusPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"map" | "schedule" | "buses">("map");
  const { vehicles, busStops, isLoading: vehiclesLoading } = useVehicles();
  const { schedules, isLoading: schedulesLoading } = useBusSchedule();
  const { addFavoriteStop, unreadCount } = useNotifications();
  const [selectedBus, setSelectedBus] = useState<Vehicle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleBusClick = (vehicle: Vehicle) => {
    setSelectedBus(vehicle);
    setDrawerOpen(true);
  };

  const handleStopClick = (stop: BusStop) => {
    toast.info(`📍 ${stop.name}`, {
      description: stop.address || 'Arrêt de bus',
      action: {
        label: '⭐ Favori',
        onClick: () => addFavoriteStop(stop.id),
      },
    });
  };

  return (
    <MobileLayout>
      <header className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Mode</span>
              <span className="text-foreground"> Bus</span>
            </h1>
            <p className="text-sm text-muted-foreground">Suivez les bus en temps réel</p>
          </div>
          <Button 
            size="icon" 
            variant="outline" 
            className="rounded-full relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col px-4 pb-4"
      >
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="map" className="flex items-center gap-1.5">
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Carte</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Horaires</span>
          </TabsTrigger>
          <TabsTrigger value="buses" className="flex items-center gap-1.5">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Bus</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <div className="relative min-h-[340px] h-[340px] rounded-2xl overflow-hidden border border-border">
            <BusMap
              vehicles={vehicles}
              busStops={busStops}
              className="absolute inset-0"
              onVehicleClick={handleBusClick}
              onStopClick={handleStopClick}
            />
            <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 border border-border/50 z-10">
              <div className="flex items-center justify-around text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-lokebo-success animate-pulse" />
                  <span className="text-foreground">En service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-lokebo-warning" />
                  <span className="text-foreground">Complet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-primary bg-lokebo-dark" />
                  <span className="text-foreground">Arrêt</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
            <SchedulePanel schedules={schedules} isLoading={schedulesLoading} />
          </div>
        </TabsContent>

        <TabsContent value="buses" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
            <BusList
              vehicles={vehicles}
              isLoading={vehiclesLoading}
              onVehicleClick={handleBusClick}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-3">
        <Button
          className="w-full h-14 text-base font-semibold rounded-xl shadow-lg bg-lokebo-dark hover:bg-lokebo-dark/90"
          size="lg"
          onClick={() => setActiveTab("schedule")}
        >
          <MapPin className="w-5 h-5 mr-2" />
          Trouver un arrêt
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12 rounded-xl"
            onClick={() => setActiveTab("schedule")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Horaires
          </Button>
          <Button 
            variant="outline" 
            className="h-12 rounded-xl"
            onClick={() => navigate("/notifications")}
          >
            <Star className="w-4 h-4 mr-2" />
            Favoris
          </Button>
        </div>
      </div>

      {/* Bus Detail Drawer */}
      <BusDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        vehicle={selectedBus}
      />
    </MobileLayout>
  );
};

export default BusPage;
