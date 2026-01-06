import MobileLayout from "@/components/layout/MobileLayout";
import { Bus, MapPin, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const BusPage = () => {
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
          <Button size="icon" variant="outline" className="rounded-full">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Map Placeholder */}
      <div className="relative flex-1 mx-4 mb-4 rounded-2xl overflow-hidden bg-muted border border-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-lokebo-dark flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Carte des bus</p>
            <p className="text-sm text-muted-foreground/70">Bientôt disponible</p>
          </div>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 border border-border">
          <div className="flex items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lokebo-success" />
              <span className="text-muted-foreground">En service</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lokebo-warning" />
              <span className="text-muted-foreground">Retard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Hors service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-3">
        <Button className="w-full h-14 text-base font-semibold rounded-xl shadow-lg bg-lokebo-dark hover:bg-lokebo-dark/90" size="lg">
          <MapPin className="w-5 h-5 mr-2" />
          Trouver un arrêt
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 rounded-xl">
            <Clock className="w-4 h-4 mr-2" />
            Horaires
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Bell className="w-4 h-4 mr-2" />
            Alertes
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default BusPage;
