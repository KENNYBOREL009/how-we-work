import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation, Clock, Home, Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Destination {
  name: string;
  distance: number;
  recent?: boolean;
  type?: "saved" | "recent" | "popular";
}

interface DestinationSearchProps {
  onSelect: (destination: Destination) => void;
  className?: string;
}

const popularDestinations: Destination[] = [
  { name: "Marché Central", distance: 2.5, type: "popular" },
  { name: "Akwa Palace", distance: 3.2, type: "popular" },
  { name: "Bonanjo", distance: 4.1, type: "popular" },
  { name: "Bepanda", distance: 5.0, type: "popular" },
  { name: "Ndokoti", distance: 6.5, type: "popular" },
  { name: "Bonabéri", distance: 8.0, type: "popular" },
  { name: "Deido", distance: 3.8, type: "popular" },
  { name: "New Bell", distance: 2.0, type: "popular" },
];

const recentDestinations: Destination[] = [
  { name: "Akwa Palace", distance: 3.2, type: "recent" },
  { name: "Bonanjo", distance: 4.1, type: "recent" },
];

const addressTypeIcons: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5 text-primary" />,
  work: <Briefcase className="w-5 h-5 text-amber-500" />,
  other: <Star className="w-5 h-5 text-muted-foreground" />,
};

export const DestinationSearch = ({ onSelect, className }: DestinationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const fetchSavedAddresses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_addresses" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) {
      setSavedAddresses(data);
    }
  };

  const filteredDestinations = popularDestinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomDestination = () => {
    if (!searchQuery.trim()) return;
    onSelect({ name: searchQuery, distance: 5 });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Input */}
      <div className="sticky top-0 bg-background z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Current Location */}
      <button 
        className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-4 hover:bg-primary/10 transition-colors"
        onClick={() => onSelect({ name: "Ma position actuelle", distance: 0 })}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Position actuelle</p>
          <p className="text-sm text-muted-foreground">Utiliser ma localisation GPS</p>
        </div>
      </button>

      {/* Saved Addresses */}
      {!searchQuery && savedAddresses.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
            <Star className="w-3 h-3" />
            Mes adresses
          </p>
          <div className="space-y-2">
            {savedAddresses.map((addr: any) => (
              <button
                key={addr.id}
                onClick={() => onSelect({ name: addr.address, distance: 4 })}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  {addressTypeIcons[addr.address_type] || addressTypeIcons.other}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{addr.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{addr.address}</p>
                </div>
                {addr.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Par défaut</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent destinations */}
      {!searchQuery && recentDestinations.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Récents
          </p>
          <div className="space-y-2">
            {recentDestinations.map((dest, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(dest)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
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
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-3">
          {searchQuery ? "Résultats" : "Destinations populaires"}
        </p>
        <div className="space-y-2">
          {filteredDestinations.map((dest, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(dest)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
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
        <div className="sticky bottom-0 pt-4 pb-2 bg-background">
          <Button 
            className="w-full h-14"
            size="lg"
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
