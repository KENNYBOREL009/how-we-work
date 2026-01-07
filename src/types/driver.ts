// Types spécifiques aux modes de fonctionnement chauffeur

export type DriverOperatingMode = 
  | 'fleet_assigned'      // Chauffeur affecté à un propriétaire de flotte
  | 'independent_owner'   // Chauffeur indépendant propriétaire de son véhicule
  | 'independent_tenant'; // Chauffeur indépendant locataire

export interface DriverModeConfig {
  mode: DriverOperatingMode;
  label: string;
  description: string;
  color: string;
  icon: string;
  features: {
    hasFleetOwner: boolean;
    ownsVehicle: boolean;
    paysRent: boolean;
    tracksExpenses: boolean;
    submitsReports: boolean;
    hasCommission: boolean;
  };
}

export const DRIVER_MODE_CONFIGS: Record<DriverOperatingMode, DriverModeConfig> = {
  fleet_assigned: {
    mode: 'fleet_assigned',
    label: 'Chauffeur Flotte',
    description: 'Affecté à un propriétaire de flotte',
    color: 'bg-blue-500',
    icon: 'Building2',
    features: {
      hasFleetOwner: true,
      ownsVehicle: false,
      paysRent: false,
      tracksExpenses: true,
      submitsReports: true,
      hasCommission: true,
    },
  },
  independent_owner: {
    mode: 'independent_owner',
    label: 'Indépendant Propriétaire',
    description: 'Propriétaire de votre véhicule',
    color: 'bg-green-500',
    icon: 'Car',
    features: {
      hasFleetOwner: false,
      ownsVehicle: true,
      paysRent: false,
      tracksExpenses: true,
      submitsReports: false,
      hasCommission: false,
    },
  },
  independent_tenant: {
    mode: 'independent_tenant',
    label: 'Indépendant Locataire',
    description: 'Location de véhicule',
    color: 'bg-orange-500',
    icon: 'Key',
    features: {
      hasFleetOwner: false,
      ownsVehicle: false,
      paysRent: true,
      tracksExpenses: true,
      submitsReports: false,
      hasCommission: false,
    },
  },
};

export interface DriverProfile {
  id: string;
  userId: string;
  operatingMode: DriverOperatingMode;
  fleetOwnerId?: string;
  fleetVehicleId?: string;
  assignmentId?: string;
  vehicleId?: string;
  dailyRentAmount?: number;
  commissionRate?: number;
  isActive: boolean;
}

export interface DailyEarningsSummary {
  date: string;
  grossEarnings: number;
  totalExpenses: number;
  fuelCost: number;
  rentAmount: number;
  commission: number;
  netEarnings: number;
  tripCount: number;
  distanceKm: number;
}
