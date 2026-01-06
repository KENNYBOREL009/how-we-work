import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Destination {
  name: string;
  distance: number;
  recent?: boolean;
}

interface DestinationSearchProps {
  onSelect: (destination: Destination) => void;
  className?: string;
}

const popularDestinations: Destination[] = [
  { name: "Marché Central", distance: 2.5 },
  { name: "Akwa Palace", distance: 3.2 },
  { name: "Bonanjo", distance: 4.1 },
  { name: "Bepanda", distance: 5.0 },
  { name: "Ndokoti", distance: 6.5 },
  { name: "Bonabéri", distance: 8.0 },
  { name: "Deido", distance: 3.8 },
  { name: "New Bell", distance: 2.0 },
];

const recentDestinations: Destination[] = [
  { name: "Akwa Palace", distance: 3.2, recent: true },
  { name: "Bonanjo", distance: 4.1, recent: true },
];

export const DestinationSearch = ({ onSelect, className }: DestinationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDestinations = popularDestinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomDestination = () => {
    if (!searchQuery.trim()) return;
    onSelect({ name: searchQuery, distance: 5 });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Input - Uber style sticky top */}
      <div className="sticky top-0 bg-background z-10 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Où allez-vous ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg rounded-2xl border-2 border-border focus:border-primary bg-card"
            autoFocus
          />
        </div>
      </div>

      {/* Current Location */}
      <button 
        className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-4 hover:bg-primary/10 transition-colors"
        onClick={() => onSelect({ name: "Ma position actuelle", distance: 0 })}
      >
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Position actuelle</p>
          <p className="text-sm text-muted-foreground">Utiliser ma localisation GPS</p>
        </div>
      </button>

      {/* Recent destinations */}
      {!searchQuery && recentDestinations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Récents
          </p>
          <div className="space-y-1">
            {recentDestinations.map((dest) => (
              <button
                key={dest.name}
                onClick={() => onSelect(dest)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{dest.name}</p>
                  <p className="text-sm text-muted-foreground">{dest.distance} km</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular destinations */}
      <div className="flex-1 overflow-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          {searchQuery ? "Résultats" : "Destinations populaires"}
        </p>
        <div className="space-y-1">
          {filteredDestinations.map((dest) => (
            <button
              key={dest.name}
              onClick={() => onSelect(dest)}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{dest.name}</p>
                <p className="text-sm text-muted-foreground">{dest.distance} km</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom destination button */}
      {searchQuery && !filteredDestinations.find(d => d.name.toLowerCase() === searchQuery.toLowerCase()) && (
        <div className="sticky bottom-0 pt-3 pb-2 bg-background">
          <Button 
            className="w-full h-14 rounded-2xl text-base font-semibold"
            onClick={handleCustomDestination}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Aller à "{searchQuery}"
          </Button>
        </div>
      )}
    </div>
  );
};
