import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  DRIVER_SERVICE_CONFIGS, 
  type DriverServiceType 
} from '@/types/driver-services';
import { Car, Users, Crown, Check, Lock } from 'lucide-react';

interface ServiceTypeSelectorProps {
  activeService: DriverServiceType;
  authorizedServices: DriverServiceType[];
  onSelectService: (service: DriverServiceType) => void;
  compact?: boolean;
}

const ICONS = {
  Car,
  Users,
  Crown,
};

export const ServiceTypeSelector = ({
  activeService,
  authorizedServices,
  onSelectService,
  compact = false,
}: ServiceTypeSelectorProps) => {
  const services = Object.values(DRIVER_SERVICE_CONFIGS);

  if (compact) {
    return (
      <div className="flex gap-2">
        {services.map((service) => {
          const isActive = activeService === service.type;
          const isAuthorized = authorizedServices.includes(service.type);
          const IconComponent = ICONS[service.icon as keyof typeof ICONS] || Car;

          return (
            <button
              key={service.type}
              onClick={() => isAuthorized && onSelectService(service.type)}
              disabled={!isAuthorized}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                isActive 
                  ? service.bgColor + ' text-white shadow-md' 
                  : isAuthorized
                    ? 'bg-muted hover:bg-muted/80'
                    : 'bg-muted/50 opacity-50 cursor-not-allowed'
              )}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{service.shortLabel}</span>
              {isActive && <Check className="w-3 h-3" />}
              {!isAuthorized && <Lock className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {services.map((service) => {
        const isActive = activeService === service.type;
        const isAuthorized = authorizedServices.includes(service.type);
        const IconComponent = ICONS[service.icon as keyof typeof ICONS] || Car;

        return (
          <Card
            key={service.type}
            onClick={() => isAuthorized && onSelectService(service.type)}
            className={cn(
              'p-4 cursor-pointer transition-all relative overflow-hidden',
              isActive 
                ? 'ring-2 ring-primary border-primary shadow-md' 
                : isAuthorized
                  ? 'hover:border-primary/50 hover:shadow-sm'
                  : 'opacity-50 cursor-not-allowed'
            )}
          >
            {!isAuthorized && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div 
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
                  service.bgColor,
                  'text-white'
                )}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm">{service.shortLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {service.description}
              </p>
              {isActive && (
                <Badge className="mt-2 bg-primary/10 text-primary">
                  Actif
                </Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
