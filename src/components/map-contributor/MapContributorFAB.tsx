import React, { useState, useEffect } from 'react';
import { Pencil, MapPin, Route, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AddLocalNameDialog from './AddLocalNameDialog';
import ReportErrorDialog from './ReportErrorDialog';
import { useMapContributions } from '@/hooks/useMapContributions';
import { toast } from 'sonner';

interface MapContributorFABProps {
  className?: string;
}

const MapContributorFAB: React.FC<MapContributorFABProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLocalNameDialog, setShowLocalNameDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { addLocalName, reportError } = useMapContributions();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Default to Douala center
          setUserLocation({ lat: 4.0511, lng: 9.7679 });
        }
      );
    }
  }, []);

  const handleAddLocalName = async (name: string, photoUrl?: string) => {
    if (!userLocation) return { success: false };
    return await addLocalName(userLocation.lat, userLocation.lng, name, photoUrl);
  };

  const handleReportError = async (errorType: 'road_blocked' | 'one_way' | 'non_existent' | 'other', description?: string) => {
    if (!userLocation) return false;
    return await reportError(userLocation.lat, userLocation.lng, errorType, description);
  };

  const menuItems = [
    {
      icon: MapPin,
      label: 'Ajouter un Nom Local',
      description: 'Carrefour, quartier...',
      onClick: () => setShowLocalNameDialog(true),
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
    {
      icon: Route,
      label: 'Nouvelle Route',
      description: 'Enregistrer une trace GPS',
      onClick: () => toast.info('Fonctionnalité GPS bientôt disponible'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: AlertTriangle,
      label: 'Signaler une Erreur',
      description: 'Route barrée, sens unique...',
      onClick: () => setShowErrorDialog(true),
      color: 'bg-amber-500 hover:bg-amber-600',
    },
  ];

  return (
    <>
      <div className={cn('absolute bottom-24 right-4 z-50', className)}>
        {/* Expanded Menu */}
        <div
          className={cn(
            'absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg',
                'transform transition-all duration-200 hover:scale-105',
                item.color
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-white/80">{item.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-xl transition-all duration-300',
            isOpen
              ? 'bg-muted-foreground rotate-45'
              : 'bg-primary hover:bg-primary/90'
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Pencil className="w-6 h-6" />
          )}
        </Button>

        {/* Label */}
        {!isOpen && (
          <div className="absolute -left-28 top-1/2 -translate-y-1/2 bg-background/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md text-xs font-medium whitespace-nowrap">
            Améliorer la carte
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddLocalNameDialog
        open={showLocalNameDialog}
        onOpenChange={setShowLocalNameDialog}
        coordinates={userLocation}
        onSubmit={handleAddLocalName}
      />
      <ReportErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        coordinates={userLocation}
        onSubmit={handleReportError}
      />
    </>
  );
};

export default MapContributorFAB;
