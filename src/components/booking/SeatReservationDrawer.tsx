import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/hooks/useVehicles';
import { useWallet } from '@/hooks/useWallet';
import { useWalletHold } from '@/hooks/useWalletHold';
import { MapPin, Users, Clock, Car, Check, Star, Wallet, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SeatReservationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  userDestination?: string;
  onConfirm: (reservation: {
    vehicleId: string;
    seatPreference: 'front' | 'back-window' | 'back-middle' | null;
    totalPrice: number;
  }) => void;
}

type SeatPosition = 'front' | 'back-left' | 'back-middle' | 'back-right';

interface Seat {
  id: SeatPosition;
  label: string;
  isWindow: boolean;
  isFront: boolean;
  premium: boolean;
}

const seats: Seat[] = [
  { id: 'front', label: 'Avant', isWindow: true, isFront: true, premium: true },
  { id: 'back-left', label: 'Arrière Fenêtre', isWindow: true, isFront: false, premium: true },
  { id: 'back-middle', label: 'Arrière Centre', isWindow: false, isFront: false, premium: false },
  { id: 'back-right', label: 'Arrière Fenêtre', isWindow: true, isFront: false, premium: true },
];

const BOOKING_FEE = 100; // Frais de réservation fixe
const SEAT_PREMIUM = 50; // Supplément place avant/fenêtre

const SeatReservationDrawer: React.FC<SeatReservationDrawerProps> = ({
  open,
  onOpenChange,
  vehicle,
  userDestination,
  onConfirm,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { availableBalance, loading: walletLoading } = useWallet();
  const { createHold, loading: holdLoading } = useWalletHold();
  
  if (!vehicle) return null;

  const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
  const hasExistingRoute = Boolean(vehicle.destination);
  const occupiedSeats = vehicle.current_passengers || 0;
  
  // Simuler les sièges occupés
  const occupiedPositions: SeatPosition[] = [];
  if (occupiedSeats >= 1) occupiedPositions.push('back-middle');
  if (occupiedSeats >= 2) occupiedPositions.push('back-right');
  if (occupiedSeats >= 3) occupiedPositions.push('back-left');
  if (occupiedSeats >= 4) occupiedPositions.push('front');

  const isPremiumSeat = (seat: Seat) => seat.premium;
  const isOccupied = (seat: Seat) => occupiedPositions.includes(seat.id);
  
  const selectedSeatData = seats.find(s => s.id === selectedSeat);
  const seatPremium = selectedSeatData?.premium ? SEAT_PREMIUM : 0;
  const totalBookingFee = BOOKING_FEE + seatPremium;
  
  // Prix estimé de la course normale (simulation)
  const estimatedFare = 500; // À calculer dynamiquement
  const totalPrice = estimatedFare + totalBookingFee;

  // Vérifier si le solde est suffisant
  const hasInsufficientBalance = availableBalance < totalBookingFee;

  const handleConfirm = async () => {
    if (!selectedSeat) return;
    
    // Vérifier le solde disponible
    if (hasInsufficientBalance) {
      toast.error("Solde insuffisant", {
        description: `Vous avez besoin de ${totalBookingFee} FCFA disponibles. Solde actuel : ${availableBalance} FCFA`,
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Créer la caution (hold) sur le wallet
      const holdId = await createHold(
        totalBookingFee,
        `Réservation siège - ${vehicle.plate_number}`,
        undefined // tripId sera défini après création du trip
      );
      
      if (!holdId) {
        setIsProcessing(false);
        return; // L'erreur est déjà gérée dans createHold
      }
      
      toast.success("Caution prélevée", {
        description: `${totalBookingFee} FCFA séquestrés. Libérés après la course.`,
      });
      
      onConfirm({
        vehicleId: vehicle.id,
        seatPreference: selectedSeat === 'front' ? 'front' : 
                        selectedSeat === 'back-middle' ? 'back-middle' : 'back-window',
        totalPrice,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Erreur de réservation");
    } finally {
      setIsProcessing(false);
    }
  };

  // Déterminer le statut couleur du taxi
  const getStatusColor = () => {
    if (availableSeats === 0) return 'bg-destructive';
    if (availableSeats < (vehicle.capacity || 4) / 2) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getStatusLabel = () => {
    if (availableSeats === 0) return 'Complet';
    if (availableSeats < (vehicle.capacity || 4) / 2) return 'Partiellement rempli';
    return 'Places disponibles';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-lg">{vehicle.plate_number}</DrawerTitle>
                <DrawerDescription className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", getStatusColor())} />
                  {getStatusLabel()}
                </DrawerDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              <Users className="w-3 h-3 mr-1" />
              {availableSeats}/{vehicle.capacity || 4} places
            </Badge>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Direction du taxi */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {hasExistingRoute ? 'Direction actuelle' : 'Définir la direction'}
            </div>
            {hasExistingRoute ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {vehicle.shared_ride_origin || 'Position actuelle'}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-sm font-semibold">{vehicle.destination}</span>
              </div>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                🆕 Ce taxi est vide. Vous définirez la route principale !
              </p>
            )}
            
            {userDestination && hasExistingRoute && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-2">
                <Check className="w-4 h-4" />
                Votre destination "{userDestination}" est sur le trajet
              </div>
            )}
          </div>

          {/* Schéma de la voiture */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Choisissez votre siège
            </h3>
            
            <div className="bg-card border rounded-2xl p-4">
              {/* Vue de dessus de la voiture */}
              <div className="relative">
                {/* Avant de la voiture */}
                <div className="flex justify-center mb-2">
                  <div className="w-20 h-6 bg-muted rounded-t-full border-b-0 border flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">🚗 Avant</span>
                  </div>
                </div>
                
                {/* Zone chauffeur + passager avant */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Siège chauffeur */}
                  <div className="h-16 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Chauffeur</span>
                  </div>
                  
                  {/* Place avant passager */}
                  <button
                    onClick={() => !isOccupied(seats[0]) && setSelectedSeat('front')}
                    disabled={isOccupied(seats[0])}
                    className={cn(
                      "h-16 rounded-lg border-2 transition-all relative overflow-hidden",
                      isOccupied(seats[0]) 
                        ? "bg-muted/80 border-muted cursor-not-allowed"
                        : selectedSeat === 'front'
                        ? "bg-primary/20 border-primary ring-2 ring-primary ring-offset-2"
                        : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {isOccupied(seats[0]) ? (
                      <span className="text-xs text-muted-foreground">Occupé</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-xs font-medium">Avant</span>
                        <span className="text-[10px] text-amber-600">+50 FCFA</span>
                      </div>
                    )}
                    {selectedSeat === 'front' && !isOccupied(seats[0]) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                </div>
                
                {/* Sièges arrière */}
                <div className="grid grid-cols-3 gap-2">
                  {['back-left', 'back-middle', 'back-right'].map((seatId, index) => {
                    const seat = seats.find(s => s.id === seatId)!;
                    const occupied = isOccupied(seat);
                    const selected = selectedSeat === seatId;
                    
                    return (
                      <button
                        key={seatId}
                        onClick={() => !occupied && setSelectedSeat(seatId as SeatPosition)}
                        disabled={occupied}
                        className={cn(
                          "h-16 rounded-lg border-2 transition-all relative overflow-hidden",
                          occupied
                            ? "bg-muted/80 border-muted cursor-not-allowed"
                            : selected
                            ? "bg-primary/20 border-primary ring-2 ring-primary ring-offset-2"
                            : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {occupied ? (
                          <span className="text-xs text-muted-foreground">Occupé</span>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-xs font-medium">
                              {seat.isWindow ? 'Fenêtre' : 'Centre'}
                            </span>
                            {seat.premium && (
                              <span className="text-[10px] text-amber-600">+50 FCFA</span>
                            )}
                          </div>
                        )}
                        {selected && !occupied && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Arrière de la voiture */}
                <div className="flex justify-center mt-2">
                  <div className="w-32 h-4 bg-muted rounded-b-lg border-t-0 border" />
                </div>
              </div>
            </div>
          </div>

          {/* Récapitulatif prix */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Récapitulatif</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course estimée</span>
                <span className="font-medium">{estimatedFare} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de réservation</span>
                <span className="font-medium">+{BOOKING_FEE} FCFA</span>
              </div>
              {seatPremium > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Option siège premium</span>
                  <span className="font-medium">+{seatPremium} FCFA</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{totalPrice} FCFA</span>
              </div>
            </div>
          </div>

          {/* Wallet balance info */}
          <div className={cn(
            "flex items-center gap-2 text-sm rounded-lg p-3 border",
            hasInsufficientBalance 
              ? "bg-destructive/10 border-destructive/30 text-destructive" 
              : "bg-muted/30 border-transparent text-muted-foreground"
          )}>
            {hasInsufficientBalance ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Solde insuffisant : <strong>{availableBalance} FCFA</strong> disponibles
                </span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>
                  Solde disponible : <strong className="text-foreground">{availableBalance} FCFA</strong>
                </span>
              </>
            )}
          </div>

          {/* Info temps */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Clock className="w-4 h-4" />
            <span>Arrivée estimée dans <strong className="text-foreground">3-5 min</strong></span>
          </div>

          {/* Caution info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
            <strong>💰 Caution :</strong> {totalBookingFee} FCFA seront séquestrés sur votre wallet. 
            En cas d'annulation ou d'absence, une pénalité pourra être appliquée.
          </div>

          {/* Bouton confirmer */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedSeat || isProcessing || hasInsufficientBalance}
            className="w-full h-14 text-base font-bold"
            variant="premium"
          >
            {isProcessing ? (
              <>Traitement en cours...</>
            ) : hasInsufficientBalance ? (
              <>Solde insuffisant</>
            ) : selectedSeat ? (
              <>Réserver ma place • {totalPrice} FCFA</>
            ) : (
              <>Sélectionnez un siège</>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Le chauffeur recevra votre demande instantanément
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SeatReservationDrawer;
