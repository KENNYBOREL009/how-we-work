import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Crown, 
  Car, 
  Sparkles, 
  Baby, 
  Briefcase, 
  Wifi, 
  Snowflake,
  Check,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface VehicleClass {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  features: string[];
  popular?: boolean;
}

export interface ExtraService {
  id: string;
  name: string;
  icon: typeof Wifi;
  price: number;
  description: string;
}

export const vehicleClasses: VehicleClass[] = [
  {
    id: "berline",
    name: "Berline Confort",
    description: "Véhicule climatisé, propre et confortable",
    multiplier: 1,
    features: ["Climatisation", "4 places"],
  },
  {
    id: "premium",
    name: "Berline Premium",
    description: "Mercedes, BMW ou équivalent",
    multiplier: 1.5,
    features: ["Cuir", "WiFi", "Eau fraîche"],
    popular: true,
  },
  {
    id: "suv",
    name: "SUV Luxe",
    description: "Espace et prestige pour vos déplacements",
    multiplier: 2,
    features: ["7 places", "Grand coffre", "Premium sound"],
  },
];

export const extraServices: ExtraService[] = [
  {
    id: "wifi",
    name: "WiFi à bord",
    icon: Wifi,
    price: 500,
    description: "Connexion internet haut débit",
  },
  {
    id: "child-seat",
    name: "Siège enfant",
    icon: Baby,
    price: 1000,
    description: "Siège auto homologué",
  },
  {
    id: "business",
    name: "Pack Business",
    icon: Briefcase,
    price: 1500,
    description: "Chargeurs, tablette, silence",
  },
  {
    id: "extra-ac",
    name: "Clim Max",
    icon: Snowflake,
    price: 300,
    description: "Climatisation renforcée",
  },
];

interface PrivateRideOptionsProps {
  selectedClass: string;
  onClassChange: (classId: string) => void;
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  basePrice: number;
}

export const PrivateRideOptions = ({
  selectedClass,
  onClassChange,
  selectedServices,
  onServicesChange,
  basePrice,
}: PrivateRideOptionsProps) => {
  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onServicesChange(selectedServices.filter((s) => s !== serviceId));
    } else {
      onServicesChange([...selectedServices, serviceId]);
    }
  };

  const calculateClassPrice = (classItem: VehicleClass) => {
    return Math.round(basePrice * classItem.multiplier);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">VTC Privatisé</h3>
          <p className="text-sm text-muted-foreground">Service exclusif premium</p>
        </div>
      </div>

      {/* Vehicle Classes */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground mb-3">Choisir votre véhicule</p>
        {vehicleClasses.map((vehicleClass) => {
          const isSelected = selectedClass === vehicleClass.id;
          const price = calculateClassPrice(vehicleClass);

          return (
            <button
              key={vehicleClass.id}
              onClick={() => onClassChange(vehicleClass.id)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden",
                isSelected
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border bg-card hover:border-amber-500/50"
              )}
            >
              {/* Popular badge */}
              {vehicleClass.popular && (
                <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                  <Star className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                    isSelected
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  <Car className="w-7 h-7" />
                </div>

                <div className="flex-1 min-w-0 pr-16">
                  <h4 className="font-bold text-foreground">{vehicleClass.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{vehicleClass.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {vehicleClass.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 absolute top-4 right-14">
                  <p className="text-lg font-bold text-foreground">
                    {price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Extra Services */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground mb-3">Services additionnels</p>
        <div className="grid grid-cols-2 gap-2">
          {extraServices.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedServices.includes(service.id);

            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-border bg-card hover:border-amber-500/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-500 ml-auto" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.description}</p>
                <p className="text-sm font-bold text-amber-600 mt-1">+{service.price.toLocaleString()} F</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
