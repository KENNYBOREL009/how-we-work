// Types pour les services chauffeur et l'architecture hybride

export type DriverServiceType = 
  | 'taxi_classic'      // Taxi jaune classique - interface simplifiée
  | 'confort_partage'   // VTC partagé - interface intermédiaire
  | 'vtc_premium';      // VTC privé - interface complète

export interface DriverServiceConfig {
  type: DriverServiceType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  features: {
    showAI: boolean;
    showStats: boolean;
    showHotspots: boolean;
    showEarningsDetails: boolean;
    simplifiedUI: boolean;
    voiceInput: boolean;
    autoAcceptBookings: boolean;
  };
  requirements: {
    hasAC: boolean;
    minRating: number;
    vehicleClass: string[];
  };
}

export const DRIVER_SERVICE_CONFIGS: Record<DriverServiceType, DriverServiceConfig> = {
  taxi_classic: {
    type: 'taxi_classic',
    label: 'Taxi Classique',
    shortLabel: 'Classique',
    description: 'Course collective standard',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    icon: 'Car',
    features: {
      showAI: false,
      showStats: false,
      showHotspots: false,
      showEarningsDetails: false,
      simplifiedUI: true,
      voiceInput: true,
      autoAcceptBookings: false,
    },
    requirements: {
      hasAC: false,
      minRating: 0,
      vehicleClass: ['standard'],
    },
  },
  confort_partage: {
    type: 'confort_partage',
    label: 'Confort Partagé',
    shortLabel: 'Confort',
    description: 'VTC partagé climatisé',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    icon: 'Users',
    features: {
      showAI: true,
      showStats: true,
      showHotspots: true,
      showEarningsDetails: true,
      simplifiedUI: false,
      voiceInput: true,
      autoAcceptBookings: false,
    },
    requirements: {
      hasAC: true,
      minRating: 4.0,
      vehicleClass: ['standard', 'confort'],
    },
  },
  vtc_premium: {
    type: 'vtc_premium',
    label: 'VTC Premium',
    shortLabel: 'Premium',
    description: 'Course privée haut de gamme',
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    icon: 'Crown',
    features: {
      showAI: true,
      showStats: true,
      showHotspots: true,
      showEarningsDetails: true,
      simplifiedUI: false,
      voiceInput: true,
      autoAcceptBookings: false,
    },
    requirements: {
      hasAC: true,
      minRating: 4.5,
      vehicleClass: ['premium', 'SUV'],
    },
  },
};

// Zones prédéfinies pour Douala (interface simplifiée)
export const DOUALA_ZONES = [
  { id: 'akwa', name: 'Akwa', icon: '🏙️' },
  { id: 'bonanjo', name: 'Bonanjo', icon: '🏛️' },
  { id: 'deido', name: 'Deido', icon: '🏘️' },
  { id: 'bonapriso', name: 'Bonapriso', icon: '🏠' },
  { id: 'bepanda', name: 'Bépanda', icon: '🏪' },
  { id: 'ndokoti', name: 'Ndokoti', icon: '🚏' },
  { id: 'bonaberi', name: 'Bonabéri', icon: '🌉' },
  { id: 'makepe', name: 'Makepe', icon: '🏗️' },
] as const;

export type DoualZoneId = typeof DOUALA_ZONES[number]['id'];

// Interface pour le profil hybride chauffeur
export interface DriverHybridProfile {
  activeService: DriverServiceType;
  authorizedServices: DriverServiceType[];
  currentDestination?: {
    zoneId: string;
    zoneName: string;
  };
  availableSeats: number;
  maxSeats: number;
  recentDestinations: Array<{
    zoneId: string;
    zoneName: string;
    usedAt: string;
  }>;
}

// Notification de réservation pour taxi classique
export interface SeatBookingNotification {
  id: string;
  clientName: string;
  clientAvatar?: string;
  seatType: 'front' | 'back' | 'window';
  pickupDistance: number; // en mètres
  isOnRoute: boolean;
  fare: number;
  createdAt: string;
}
