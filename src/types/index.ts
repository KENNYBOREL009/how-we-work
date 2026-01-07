// =============================================
// LOKEBO DRIVE - Centralized Type Definitions
// =============================================

// =============================================
// VEHICLE TYPES
// =============================================

export type VehicleType = 'bus' | 'taxi' | 'vtc';
export type VehicleStatus = 'available' | 'full' | 'private' | 'offline';
export type RideModeType = 'standard' | 'confort-partage' | 'privatisation';

export interface Vehicle {
  id: string;
  vehicle_type: VehicleType;
  plate_number: string;
  capacity: number;
  destination: string | null;
  status: VehicleStatus;
  operator?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  ride_mode?: RideModeType;
  current_passengers?: number;
  shared_ride_origin?: string | null;
  shared_ride_fare_per_km?: number;
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

export interface BusRoute {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

// =============================================
// TRIP TYPES
// =============================================

export type TripType = 'taxi' | 'reservation' | 'confort-partage' | 'privatisation' | 'scheduled';
export type TripStatus = 'searching' | 'driver_assigned' | 'driver_arriving' | 'driver_arrived' | 'picked_up' | 'in_progress' | 'arriving_destination' | 'arrived' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Trip {
  id: string;
  user_id: string;
  vehicle_id?: string;
  trip_type: TripType;
  origin?: string;
  destination?: string;
  fare?: number;
  status: string;
  current_status: TripStatus;
  payment_status: PaymentStatus;
  is_shared_ride: boolean;
  driver_rating?: number;
  driver_comment?: string;
  pickup_location?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface SharedRidePassenger {
  id: string;
  trip_id: string;
  user_id: string;
  first_name?: string;
  avatar_url?: string;
  pickup_location?: string;
  dropoff_location?: string;
  fare_amount: number;
  joined_at: string;
  status: string;
}

// =============================================
// DRIVER TYPES
// =============================================

export type DriverDefaultType = 'cancellation' | 'ghosting';
export type RideRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface DriverStats {
  todayEarnings: number;
  todayTrips: number;
  weekEarnings: number;
  rating: number;
  acceptanceRate: number;
}

export interface DriverReliabilityScore {
  id: string;
  driver_id: string;
  reliability_score: number;
  acceptance_rate: number;
  punctuality_score: number;
  completed_trips: number;
  total_scheduled_trips: number;
  cancellation_count: number;
  ghosting_count: number;
  no_show_count: number;
  late_count: number;
  is_scheduling_blocked: boolean;
  blocked_until?: string;
  suspension_reason?: string;
  last_penalty_at?: string;
}

export interface PendingRide {
  id: string;
  clientName: string;
  clientAvatar?: string;
  origin: string;
  destination: string;
  distance: string;
  fare: number;
  isShared: boolean;
  passengerCount: number;
  expiresIn: number;
}

export interface ActiveDriverRide {
  id: string;
  clientName: string;
  clientPhone: string;
  origin: string;
  destination: string;
  fare: number;
  status: 'going_to_pickup' | 'waiting' | 'in_progress';
  eta: number;
}

export interface DriverAvailability {
  id: string;
  driver_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  origin_zone: string;
  destination_zone?: string;
  vehicle_type: string;
  is_recurring: boolean;
  specific_date?: string;
}

// =============================================
// WALLET TYPES
// =============================================

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_amount: number;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  created_at: string;
}

export interface WalletHold {
  id: string;
  wallet_id: string;
  trip_id?: string;
  amount: number;
  reason: string;
  status: 'active' | 'released';
  penalty_applied: boolean;
  penalty_amount?: number;
  penalty_reason?: string;
  created_at: string;
  released_at?: string;
}

// =============================================
// SCHEDULED TRIP TYPES
// =============================================

export type ScheduledTripStatus = 'pending' | 'matched' | 'confirmed' | 'completed' | 'cancelled';

export interface ScheduledTrip {
  id: string;
  client_id: string;
  driver_id?: string;
  origin: string;
  destination: string;
  scheduled_at: string;
  estimated_fare: number;
  security_deposit: number;
  status: ScheduledTripStatus;
  vehicle_type?: string;
  client_notes?: string;
  driver_notes?: string;
  matched_at?: string;
  driver_accepted_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  penalty_amount?: number;
}

// =============================================
// NOTIFICATION TYPES
// =============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'driver_default' | 'score_penalty' | 'trip_update';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// =============================================
// USER TYPES
// =============================================

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  bus_mode_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  address_type: 'home' | 'work' | 'other';
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}

// =============================================
// UI/COMPONENT TYPES
// =============================================

export interface Destination {
  name: string;
  distance: number;
  latitude?: number;
  longitude?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PickupRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  distance: number;
  seatPreference?: string;
  detourTime: number;
  location: string;
  isOnRoute: boolean;
}

// =============================================
// FLEET MANAGEMENT TYPES
// =============================================

export interface FleetOwner {
  id: string;
  user_id: string;
  company_name?: string;
  business_registration?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FleetVehicle {
  id: string;
  fleet_owner_id: string;
  vehicle_id: string;
  purchase_date?: string;
  purchase_price?: number;
  insurance_expiry?: string;
  technical_control_expiry?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined vehicle data
  vehicle?: Vehicle;
}

export type AssignmentType = 'permanent' | 'rotation' | 'temporary' | 'backup';
export type ShiftType = 'day' | 'night' | 'full' | 'custom';

export interface DriverAssignment {
  id: string;
  fleet_vehicle_id: string;
  driver_id: string;
  assignment_type: AssignmentType;
  shift_type?: ShiftType;
  start_date: string;
  end_date?: string;
  daily_target?: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  fleet_vehicle?: FleetVehicle;
  driver_profile?: UserProfile;
}

export type ExpenseType = 'fuel' | 'maintenance' | 'insurance' | 'fine' | 'wash' | 'toll' | 'parking' | 'other';

export interface DriverExpense {
  id: string;
  driver_id: string;
  fleet_vehicle_id?: string;
  expense_type: ExpenseType;
  amount: number;
  description?: string;
  receipt_url?: string;
  expense_date: string;
  is_reimbursed: boolean;
  reimbursed_at?: string;
  created_at: string;
}

export interface DriverDailyReport {
  id: string;
  driver_id: string;
  fleet_vehicle_id?: string;
  report_date: string;
  total_trips: number;
  total_distance_km: number;
  gross_earnings: number;
  total_expenses: number;
  net_earnings: number;
  commission_amount: number;
  driver_share: number;
  owner_share: number;
  notes?: string;
  is_validated: boolean;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}

// Fleet analytics summary
export interface FleetAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgRevenuePerVehicle: number;
  topPerformingVehicle?: string;
  period: 'daily' | 'weekly' | 'monthly';
}
