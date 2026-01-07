export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bus_routes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      bus_stops: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      client_signals: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          latitude: number
          longitude: number
          people_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          latitude: number
          longitude: number
          people_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          latitude?: number
          longitude?: number
          people_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      driver_availability: {
        Row: {
          created_at: string
          day_of_week: number
          destination_zone: string | null
          driver_id: string
          end_time: string
          id: string
          is_recurring: boolean | null
          origin_zone: string
          specific_date: string | null
          start_time: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          destination_zone?: string | null
          driver_id: string
          end_time: string
          id?: string
          is_recurring?: boolean | null
          origin_zone: string
          specific_date?: string | null
          start_time: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          destination_zone?: string | null
          driver_id?: string
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          origin_zone?: string
          specific_date?: string | null
          start_time?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      driver_ratings: {
        Row: {
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          rating: number
          trip_id: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          rating: number
          trip_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          rating?: number
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reliability_scores: {
        Row: {
          acceptance_rate: number | null
          blocked_until: string | null
          completed_trips: number | null
          created_at: string
          driver_id: string
          id: string
          is_scheduling_blocked: boolean | null
          late_count: number | null
          no_show_count: number | null
          punctuality_score: number | null
          reliability_score: number | null
          total_scheduled_trips: number | null
          updated_at: string
        }
        Insert: {
          acceptance_rate?: number | null
          blocked_until?: string | null
          completed_trips?: number | null
          created_at?: string
          driver_id: string
          id?: string
          is_scheduling_blocked?: boolean | null
          late_count?: number | null
          no_show_count?: number | null
          punctuality_score?: number | null
          reliability_score?: number | null
          total_scheduled_trips?: number | null
          updated_at?: string
        }
        Update: {
          acceptance_rate?: number | null
          blocked_until?: string | null
          completed_trips?: number | null
          created_at?: string
          driver_id?: string
          id?: string
          is_scheduling_blocked?: boolean | null
          late_count?: number | null
          no_show_count?: number | null
          punctuality_score?: number | null
          reliability_score?: number | null
          total_scheduled_trips?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      favorite_stops: {
        Row: {
          created_at: string
          id: string
          notify_on_approach: boolean | null
          notify_radius_meters: number | null
          stop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_approach?: boolean | null
          notify_radius_meters?: number | null
          stop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_approach?: boolean | null
          notify_radius_meters?: number | null
          stop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_stops_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "bus_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      nearby_contacts: {
        Row: {
          contact_phone: string | null
          contact_user_id: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          nickname: string | null
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          nickname?: string | null
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          nickname?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bus_mode_enabled: boolean | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bus_mode_enabled?: boolean | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bus_mode_enabled?: boolean | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          arrival_time: string | null
          created_at: string
          id: string
          route_id: string
          stop_id: string
          stop_order: number
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          id?: string
          route_id: string
          stop_id: string
          stop_order: number
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          id?: string
          route_id?: string
          stop_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "bus_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_trips: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          client_notes: string | null
          created_at: string
          destination: string
          driver_accepted_at: string | null
          driver_id: string | null
          driver_notes: string | null
          estimated_fare: number
          id: string
          matched_at: string | null
          origin: string
          penalty_amount: number | null
          scheduled_at: string
          security_deposit: number | null
          status: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id: string
          client_notes?: string | null
          created_at?: string
          destination: string
          driver_accepted_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_fare: number
          id?: string
          matched_at?: string | null
          origin: string
          penalty_amount?: number | null
          scheduled_at: string
          security_deposit?: number | null
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string
          client_notes?: string | null
          created_at?: string
          destination?: string
          driver_accepted_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_fare?: number
          id?: string
          matched_at?: string | null
          origin?: string
          penalty_amount?: number | null
          scheduled_at?: string
          security_deposit?: number | null
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      shared_ride_passengers: {
        Row: {
          avatar_url: string | null
          dropoff_location: string | null
          fare_amount: number
          first_name: string | null
          id: string
          joined_at: string
          pickup_location: string | null
          status: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          dropoff_location?: string | null
          fare_amount: number
          first_name?: string | null
          id?: string
          joined_at?: string
          pickup_location?: string | null
          status?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          dropoff_location?: string | null
          fare_amount?: number
          first_name?: string | null
          id?: string
          joined_at?: string
          pickup_location?: string | null
          status?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_ride_passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_budgets: {
        Row: {
          created_at: string
          daily_cost: number
          end_date: string
          id: string
          is_active: boolean
          locked_amount: number
          name: string
          start_date: string
          total_amount: number
          updated_at: string
          user_id: string
          working_days: number
        }
        Insert: {
          created_at?: string
          daily_cost: number
          end_date: string
          id?: string
          is_active?: boolean
          locked_amount?: number
          name?: string
          start_date?: string
          total_amount: number
          updated_at?: string
          user_id: string
          working_days?: number
        }
        Update: {
          created_at?: string
          daily_cost?: number
          end_date?: string
          id?: string
          is_active?: boolean
          locked_amount?: number
          name?: string
          start_date?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          working_days?: number
        }
        Relationships: []
      }
      trips: {
        Row: {
          cancellation_penalty: number | null
          client_confirmed_at: string | null
          completed_at: string | null
          created_at: string
          current_status: string | null
          destination: string | null
          driver_arrival_at: string | null
          driver_comment: string | null
          driver_made_detour: boolean | null
          driver_rating: number | null
          fare: number | null
          id: string
          is_shared_ride: boolean | null
          no_show_at: string | null
          origin: string | null
          payment_confirmed_at: string | null
          payment_status: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string | null
          started_at: string | null
          status: string
          trip_type: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          cancellation_penalty?: number | null
          client_confirmed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_status?: string | null
          destination?: string | null
          driver_arrival_at?: string | null
          driver_comment?: string | null
          driver_made_detour?: boolean | null
          driver_rating?: number | null
          fare?: number | null
          id?: string
          is_shared_ride?: boolean | null
          no_show_at?: string | null
          origin?: string | null
          payment_confirmed_at?: string | null
          payment_status?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string | null
          started_at?: string | null
          status?: string
          trip_type: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          cancellation_penalty?: number | null
          client_confirmed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_status?: string | null
          destination?: string | null
          driver_arrival_at?: string | null
          driver_comment?: string | null
          driver_made_detour?: boolean | null
          driver_rating?: number | null
          fare?: number | null
          id?: string
          is_shared_ride?: boolean | null
          no_show_at?: string | null
          origin?: string | null
          payment_confirmed_at?: string | null
          payment_status?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string | null
          started_at?: string | null
          status?: string
          trip_type?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address: string
          address_type: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          address_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          address_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_positions: {
        Row: {
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
          vehicle_id: string
        }
        Insert: {
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
          vehicle_id: string
        }
        Update: {
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_positions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number | null
          created_at: string
          current_passengers: number | null
          current_route_id: string | null
          destination: string | null
          driver_id: string | null
          id: string
          is_active: boolean | null
          operator: string | null
          plate_number: string
          ride_mode: string | null
          shared_ride_fare_per_km: number | null
          shared_ride_origin: string | null
          status: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          current_passengers?: number | null
          current_route_id?: string | null
          destination?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          operator?: string | null
          plate_number: string
          ride_mode?: string | null
          shared_ride_fare_per_km?: number | null
          shared_ride_origin?: string | null
          status?: string
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          current_passengers?: number | null
          current_route_id?: string | null
          destination?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          operator?: string | null
          plate_number?: string
          ride_mode?: string | null
          shared_ride_fare_per_km?: number | null
          shared_ride_origin?: string | null
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_current_route_id_fkey"
            columns: ["current_route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_holds: {
        Row: {
          amount: number
          created_at: string
          id: string
          penalty_amount: number | null
          penalty_applied: boolean | null
          penalty_reason: string | null
          reason: string
          released_at: string | null
          status: string
          trip_id: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          penalty_amount?: number | null
          penalty_applied?: boolean | null
          penalty_reason?: string | null
          reason: string
          released_at?: string | null
          status?: string
          trip_id?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          penalty_amount?: number | null
          penalty_applied?: boolean | null
          penalty_reason?: string | null
          reason?: string
          released_at?: string | null
          status?: string
          trip_id?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_holds_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_holds_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          locked_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          locked_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          locked_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_signal: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_people_count: number
        }
        Returns: string
      }
      create_wallet_hold: {
        Args: {
          p_amount: number
          p_reason: string
          p_trip_id?: string
          p_user_id: string
        }
        Returns: string
      }
      get_driver_avg_rating: { Args: { p_driver_id: string }; Returns: number }
      release_wallet_hold: {
        Args: {
          p_apply_penalty?: boolean
          p_hold_id: string
          p_penalty_percent?: number
          p_penalty_reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
