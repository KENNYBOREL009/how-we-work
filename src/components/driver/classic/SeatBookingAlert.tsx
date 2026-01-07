import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Armchair, Check } from 'lucide-react';
import type { SeatBookingNotification } from '@/types/driver-services';

interface SeatBookingAlertProps {
  notification: SeatBookingNotification;
  onAcknowledge: () => void;
  onDismiss: () => void;
}

export const SeatBookingAlert = ({
  notification,
  onAcknowledge,
  onDismiss,
}: SeatBookingAlertProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 50);

    // Son de caisse enregistreuse
    try {
      // Utiliser un son web standard (bip distinctif)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Créer un son de "caisse enregistreuse" synthétique
      const playChaChing = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      };

      playChaChing();

      // Vibration si disponible
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (e) {
      console.log('Audio non disponible');
    }
  }, []);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getSeatLabel = (type: string) => {
    switch (type) {
      case 'front': return 'Place Avant';
      case 'window': return 'Place Fenêtre';
      default: return 'Place Arrière';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
    >
      <div 
        className={`w-full max-w-sm bg-gradient-to-b from-amber-400 to-yellow-500 rounded-3xl p-6 shadow-2xl transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'
        }`}
      >
        {/* Icône principale */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Armchair className="w-14 h-14 text-amber-600" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">💰</span>
            </div>
          </div>
        </div>

        {/* Message principal */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            1 PLACE VENDUE !
          </h1>
          <p className="text-xl font-semibold text-gray-800">
            {notification.fare.toLocaleString()} FCFA
          </p>
        </div>

        {/* Détails client */}
        <div className="bg-white/90 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-amber-500">
              <AvatarImage src={notification.clientAvatar} />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-bold">
                {notification.clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-gray-900">{notification.clientName}</p>
              <p className="text-sm text-gray-600">{getSeatLabel(notification.seatType)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-800">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="font-semibold">
              Client à {formatDistance(notification.pickupDistance)}
            </span>
            {notification.isOnRoute && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Sur votre route
              </span>
            )}
          </div>
        </div>

        {/* Bouton d'action */}
        <Button
          onClick={onAcknowledge}
          className="w-full h-16 text-xl font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-lg"
        >
          <Check className="w-6 h-6 mr-2" />
          J'AI COMPRIS
        </Button>

        {/* Bouton secondaire */}
        <button
          onClick={onDismiss}
          className="w-full mt-3 py-2 text-gray-700 text-sm font-medium"
        >
          Impossible de prendre ce client
        </button>
      </div>
    </div>
  );
};
