import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Car, Key, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriverOperatingMode } from '@/types/driver';
import { DRIVER_MODE_CONFIGS } from '@/types/driver';

interface OperatingModeSelectorProps {
  currentMode: DriverOperatingMode | null;
  onSelectMode: (mode: DriverOperatingMode) => void;
  isLoading?: boolean;
}

const IconMap = {
  Building2,
  Car,
  Key,
};

export const OperatingModeSelector = ({
  currentMode,
  onSelectMode,
  isLoading,
}: OperatingModeSelectorProps) => {
  const modes = Object.values(DRIVER_MODE_CONFIGS);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Mode de fonctionnement</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Sélectionnez votre statut professionnel
        </p>
      </div>

      <div className="grid gap-3">
        {modes.map((config) => {
          const Icon = IconMap[config.icon as keyof typeof IconMap] || Car;
          const isSelected = currentMode === config.mode;

          return (
            <Card
              key={config.mode}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onSelectMode(config.mode)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      config.color
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{config.label}</h3>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {config.features.hasFleetOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Flotte
                        </Badge>
                      )}
                      {config.features.ownsVehicle && (
                        <Badge variant="secondary" className="text-xs">
                          Véhicule personnel
                        </Badge>
                      )}
                      {config.features.paysRent && (
                        <Badge variant="secondary" className="text-xs">
                          Location
                        </Badge>
                      )}
                      {config.features.hasCommission && (
                        <Badge variant="outline" className="text-xs">
                          Commission
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Vous pourrez modifier ce paramètre ultérieurement dans les réglages
      </p>
    </div>
  );
};
