// =============================================
// LOKEBO DRIVE - Centralized Constants
// =============================================

// =============================================
// GEOGRAPHIC ZONES (Douala)
// =============================================

export const ZONES = [
  "Bonanjo",
  "Akwa",
  "Akwa Nord",
  "Deido",
  "Kotto",
  "Makepe",
  "Bonaberi",
  "Bepanda",
  "Ndokoti",
  "Bonapriso",
  "New-Bell",
  "Cite SIC",
] as const;

export type Zone = typeof ZONES[number];

// =============================================
// TIME & SCHEDULING
// =============================================

export const DAYS_OF_WEEK = [
  { value: 0, label: "Dimanche", short: "Dim" },
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
] as const;

export const HOURS = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);

export const getDayName = (dayIndex: number): string => {
  const day = DAYS_OF_WEEK.find(d => d.value === dayIndex);
  return day?.label || 'Inconnu';
};

export const getDayShortName = (dayIndex: number): string => {
  const day = DAYS_OF_WEEK.find(d => d.value === dayIndex);
  return day?.short || '?';
};

// =============================================
// PRICING & FEES
// =============================================

export const PRICING = {
  // Base reservation fee (held in wallet)
  SEAT_RESERVATION_FEE: 150,
  SEAT_PREMIUM_FEE: 50,
  
  // Scheduled trip security deposit
  SCHEDULED_TRIP_DEPOSIT: 500,
  
  // Cancellation penalties (percentage)
  LATE_CANCELLATION_PENALTY: 50, // 50% of deposit
  NO_SHOW_PENALTY: 100, // 100% of deposit
  
  // Per km rates by mode
  RATE_PER_KM: {
    standard: 200,
    'confort-partage': 180,
    privatisation: 350,
  },
  
  // Base prices by mode
  BASE_PRICE: {
    standard: 500,
    'confort-partage': 400,
    privatisation: 2000,
  },
} as const;

// =============================================
// VEHICLE CONFIGURATION
// =============================================

export const VEHICLE_TYPES = {
  standard: {
    id: 'standard',
    name: 'Standard',
    icon: 'Car',
    color: 'primary',
  },
  confort: {
    id: 'confort',
    name: 'Confort',
    icon: 'Car',
    color: 'violet',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    icon: 'Crown',
    color: 'amber',
  },
} as const;

export const VEHICLE_CLASSES = [
  { id: 'berline', name: 'Berline', multiplier: 1.0 },
  { id: 'premium', name: 'Premium', multiplier: 1.3 },
  { id: 'suv', name: 'SUV', multiplier: 1.5 },
] as const;

export const EXTRA_SERVICES = [
  { id: 'wifi', name: 'WiFi', price: 200 },
  { id: 'child_seat', name: 'Siège enfant', price: 300 },
  { id: 'water', name: 'Eau fraîche', price: 100 },
  { id: 'charger', name: 'Chargeur', price: 0 },
] as const;

// =============================================
// SEAT CONFIGURATION
// =============================================

export const SEATS = [
  { id: 'front', label: 'Avant', isWindow: true, isFront: true, premium: true },
  { id: 'back-left', label: 'Arrière Gauche', isWindow: true, isFront: false, premium: false },
  { id: 'back-middle', label: 'Arrière Milieu', isWindow: false, isFront: false, premium: false },
  { id: 'back-right', label: 'Arrière Droite', isWindow: true, isFront: false, premium: false },
] as const;

export type SeatId = typeof SEATS[number]['id'];

// =============================================
// DRIVER RELIABILITY THRESHOLDS
// =============================================

export const DRIVER_RELIABILITY = {
  // Score thresholds
  SCORE_EXCELLENT: 90,
  SCORE_GOOD: 80,
  SCORE_WARNING: 50,
  
  // Penalties
  PENALTY_CANCELLATION: 5,
  PENALTY_GHOSTING: 15,
  PENALTY_LATE: 3,
  PENALTY_NO_SHOW: 10,
  
  // Blocking thresholds
  BLOCK_RESERVATIONS_THRESHOLD: 80,
  SUSPENSION_THRESHOLD: 50,
  SUSPENSION_DURATION_HOURS: 24,
} as const;

// =============================================
// MAP CONFIGURATION
// =============================================

export const MAP_CONFIG = {
  // Default center (Douala, Cameroon)
  DEFAULT_CENTER: {
    lat: 4.0511,
    lng: 9.7043,
  },
  
  // Default zoom levels
  ZOOM: {
    city: 12,
    neighborhood: 14,
    street: 16,
    building: 18,
  },
  
  // Geolocation bounds (Douala region)
  BOUNDS: {
    minLat: 3.5,
    maxLat: 5.0,
    minLng: 9.0,
    maxLng: 10.5,
  },
  
  // Signal visibility radius in meters
  SIGNAL_RADIUS: 500,
  
  // Default visibility radius for map
  DEFAULT_VISIBILITY_RADIUS: 800,
} as const;

// =============================================
// STATUS COLORS
// =============================================

export const STATUS_COLORS = {
  vehicle: {
    available: '#22c55e', // green-500
    full: '#ef4444',      // red-500
    private: '#f59e0b',   // amber-500
    offline: '#6b7280',   // gray-500
  },
  rideMode: {
    standard: '#ffd42f',        // lokebo yellow
    'confort-partage': '#8b5cf6', // violet-500
    privatisation: '#f59e0b',    // amber-500
  },
  trip: {
    searching: '#3b82f6',    // blue-500
    assigned: '#8b5cf6',     // violet-500
    in_progress: '#22c55e',  // green-500
    completed: '#10b981',    // emerald-500
    cancelled: '#ef4444',    // red-500
  },
} as const;

// =============================================
// API RATE LIMITS
// =============================================

export const RATE_LIMITS = {
  SIGNAL_COOLDOWN_SECONDS: 60,
  SIGNAL_DURATION_MINUTES: 5,
  MAX_PEOPLE_PER_SIGNAL: 10,
  RIDE_REQUEST_TIMEOUT_SECONDS: 30,
} as const;

// =============================================
// OPERATORS
// =============================================

export const OPERATORS = {
  BUS: 'SOCATUR',
  VTC_DEFAULT: 'LOKEBO',
  VTC_PREMIUM: 'VTC Premium',
} as const;
