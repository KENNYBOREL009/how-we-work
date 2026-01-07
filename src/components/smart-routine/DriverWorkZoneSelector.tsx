import React, { useState } from 'react';
import { MapPin, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CityZone, DriverIntention, DemandPrediction } from '@/hooks/useSmartRoutine';

interface DriverWorkZoneSelectorProps {
  zones: CityZone[];
  currentIntention: DriverIntention | null;
  predictions: DemandPrediction[];
  onSave: (zoneId: string | null, zoneName: string, startTime: string, endTime?: string) => Promise<boolean>;
}

const DriverWorkZoneSelector: React.FC<DriverWorkZoneSelectorProps> = ({
  zones,
  currentIntention,
  predictions,
  onSave,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(currentIntention?.target_zone_id || '');
  const [startTime, setStartTime] = useState(currentIntention?.start_time || '07:00');
  const [endTime, setEndTime] = useState(currentIntention?.end_time || '');
  const [isSaving, setIsSaving] = useState(false);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const zonePrediction = predictions.find(p => p.zone_id === selectedZoneId);
  const isHighDemand = zonePrediction?.demand_level === 'high';

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(selectedZoneId || null, selectedZone?.name || '', startTime, endTime || undefined);
    setIsSaving(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Ma Zone de Chasse Demain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Zone selector */}
        <div className="space-y-2">
          <Label>Où comptez-vous rouler ?</Label>
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => {
                const pred = predictions.find(p => p.zone_id === zone.id);
                return (
                  <SelectItem key={zone.id} value={zone.id}>
                    <div className="flex items-center gap-2">
                      <span>{zone.name}</span>
                      {pred?.demand_level === 'high' && (
                        <Badge variant="destructive" className="text-xs">🔥 Forte demande</Badge>
                      )}
                      {pred?.demand_level === 'medium' && (
                        <Badge variant="secondary" className="text-xs">Demande moyenne</Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* High demand feedback */}
        {isHighDemand && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">🔥 Zone à forte demande prévue !</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
              {zonePrediction?.predicted_demand} demandes prévues, seulement {zonePrediction?.driver_supply} chauffeurs
            </p>
          </div>
        )}

        {/* Time selector */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Je commence à
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Je termine à (optionnel)</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Current intention display */}
        {currentIntention && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">Intention actuelle :</p>
            <p className="font-medium">
              {currentIntention.target_zone_name} à partir de {currentIntention.start_time}
            </p>
          </div>
        )}

        {/* Save button */}
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!selectedZoneId || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              Enregistrer mon intention
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DriverWorkZoneSelector;
