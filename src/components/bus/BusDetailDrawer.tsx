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
import { Switch } from '@/components/ui/switch';
import { Vehicle } from '@/hooks/useVehicles';
import { useWallet } from '@/hooks/useWallet';
import BusPaymentMethods from './BusPaymentMethods';
import {
  Bus,
  MapPin,
  Users,
  Bell,
  BellRing,
  CreditCard,
  Ticket,
  Navigation,
  Plus,
  Minus,
  Wallet,
  AlertTriangle,
  Check,
  Loader2,
  Armchair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BusDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}

const BUS_TICKET_PRICE = 200; // FCFA per ticket

const BusDetailDrawer: React.FC<BusDetailDrawerProps> = ({
  open,
  onOpenChange,
  vehicle,
}) => {
  const [activeSection, setActiveSection] = useState<'info' | 'ticket' | 'alert'>('info');
  const [ticketCount, setTicketCount] = useState(1);
  const [alertOnArrival, setAlertOnArrival] = useState(false);
  const [alertOnApproach, setAlertOnApproach] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketPurchased, setTicketPurchased] = useState(false);
  const [wantSeatReservation, setWantSeatReservation] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const { availableBalance, loading: walletLoading } = useWallet();

  if (!vehicle) return null;

  const currentPassengers = vehicle.current_passengers || 0;
  const capacity = vehicle.capacity || 70;
  const availableSeats = capacity - currentPassengers;
  const fillPercent = Math.round((currentPassengers / capacity) * 100);

  const totalPrice = BUS_TICKET_PRICE * ticketCount + (wantSeatReservation ? 100 : 0);
  const hasSufficientBalance = availableBalance >= totalPrice;

  const handlePurchaseTicket = async () => {
    if (!hasSufficientBalance) {
      toast.error('Solde insuffisant', {
        description: `Rechargez votre wallet. Besoin de ${totalPrice} FCFA.`,
      });
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    setTicketPurchased(true);

    toast.success(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} acheté${ticketCount > 1 ? 's' : ''} !`, {
      description: `${vehicle.plate_number} → ${vehicle.destination || 'En service'}`,
    });

    setTimeout(() => {
      setTicketPurchased(false);
      setTicketCount(1);
      setWantSeatReservation(false);
      setSelectedSeat(null);
    }, 3000);
  };

  const handleSetAlert = () => {
    if (alertOnArrival || alertOnApproach) {
      toast.success('Alertes configurées !', {
        description: `${alertOnApproach ? '📍 Alerte à 2km' : ''}${alertOnArrival && alertOnApproach ? ' + ' : ''}${alertOnArrival ? '🚌 Alerte à l\'arrivée' : ''}`,
      });
    }
  };

  // Simulated seat layout for a bus
  const busRows = 12;
  const seatsPerRow = 4; // 2 left + 2 right
  const occupiedSeats = new Set<string>();
  for (let i = 0; i < currentPassengers && i < busRows * seatsPerRow; i++) {
    const row = Math.floor(i / seatsPerRow);
    const col = i % seatsPerRow;
    occupiedSeats.add(`${row}-${col}`);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Bus className="w-7 h-7 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-lg flex items-center gap-2">
                  {vehicle.plate_number}
                  {vehicle.operator && (
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {vehicle.operator}
                    </Badge>
                  )}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-2">
                  {vehicle.destination && (
                    <>
                      <Navigation className="w-3 h-3" />
                      Direction: <strong>{vehicle.destination}</strong>
                    </>
                  )}
                </DrawerDescription>
              </div>
            </div>
          </div>

          {/* Barre de remplissage */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Taux de remplissage</span>
              <span className="font-bold">{currentPassengers}/{capacity} passagers</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  fillPercent > 85 ? "bg-destructive" : fillPercent > 60 ? "bg-amber-500" : "bg-green-500"
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-muted-foreground">
              <span>{availableSeats} places disponibles</span>
              <span>{fillPercent}% occupé</span>
            </div>
          </div>
        </DrawerHeader>

        {/* Section tabs */}
        <div className="px-4 mb-3">
          <div className="flex gap-2">
            {[
              { key: 'info', icon: Bus, label: 'Infos' },
              { key: 'ticket', icon: Ticket, label: 'Payer' },
              { key: 'alert', icon: Bell, label: 'Alertes' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as typeof activeSection)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  activeSection === key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* === INFO SECTION === */}
          {activeSection === 'info' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{availableSeats}</p>
                  <p className="text-[10px] text-muted-foreground">Places libres</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{vehicle.speed || 0}</p>
                  <p className="text-[10px] text-muted-foreground">km/h</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{BUS_TICKET_PRICE}</p>
                  <p className="text-[10px] text-muted-foreground">FCFA/ticket</p>
                </div>
              </div>

              {vehicle.destination && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Itinéraire</span>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Position actuelle</span>
                    <span className="mx-2">→</span>
                    <strong className="text-foreground">{vehicle.destination}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={() => setActiveSection('ticket')}
                  disabled={availableSeats === 0}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Acheter un ticket
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => setActiveSection('alert')}
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* === TICKET/PAYMENT SECTION === */}
          {activeSection === 'ticket' && (
            <BusPaymentMethods
              vehicle={vehicle}
              ticketCount={ticketCount}
              totalPrice={totalPrice}
              onPaymentComplete={(method, code) => {
                setTicketPurchased(true);
                setTimeout(() => {
                  setTicketPurchased(false);
                  setTicketCount(1);
                  setWantSeatReservation(false);
                  setSelectedSeat(null);
                }, 5000);
              }}
            />
          )}

          {/* === ALERT SECTION === */}
          {activeSection === 'alert' && (
            <>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <BellRing className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold">Alertes de proximité</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recevez une notification quand ce bus approche de votre position.
                </p>
              </div>

              {/* Alert: Bus approaches 2km */}
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Bus à moins de 2 km</p>
                    <p className="text-xs text-muted-foreground">
                      Alerte quand le bus se rapproche
                    </p>
                  </div>
                </div>
                <Switch
                  checked={alertOnApproach}
                  onCheckedChange={setAlertOnApproach}
                />
              </div>

              {/* Alert: Bus arrived */}
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Bus arrivé à l'arrêt</p>
                    <p className="text-xs text-muted-foreground">
                      Alerte quand le bus est à votre arrêt
                    </p>
                  </div>
                </div>
                <Switch
                  checked={alertOnArrival}
                  onCheckedChange={setAlertOnArrival}
                />
              </div>

              {/* Both alerts info */}
              <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">💡 Conseil</p>
                <p>
                  Activez les deux alertes pour être prévenu d'abord quand le bus approche (2 km),
                  puis quand il arrive exactement à votre arrêt.
                </p>
              </div>

              <Button
                className="w-full h-12 rounded-xl font-semibold"
                onClick={handleSetAlert}
                disabled={!alertOnArrival && !alertOnApproach}
              >
                <Bell className="w-4 h-4 mr-2" />
                {alertOnArrival || alertOnApproach
                  ? 'Activer les alertes'
                  : 'Sélectionnez au moins une alerte'}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BusDetailDrawer;
