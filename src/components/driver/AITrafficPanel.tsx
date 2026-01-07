import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  Sparkles, 
  Loader2, 
  Clock,
  Route,
  Flame,
  Target,
  RefreshCw
} from 'lucide-react';
import { useTrafficIntelligence } from '@/hooks/useTrafficIntelligence';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AITrafficPanelProps {
  className?: string;
  onZoneClick?: (lat: number, lng: number) => void;
}

export const AITrafficPanel = ({ className = '', onZoneClick }: AITrafficPanelProps) => {
  const { 
    predictions, 
    recommendations, 
    learnedRoutes,
    isAnalyzing, 
    lastAnalysis,
    predictTraffic,
    getRecommendations,
    learnRoutes
  } = useTrafficIntelligence();

  const [activeTab, setActiveTab] = useState<'predictions' | 'recommendations' | 'routes'>('predictions');

  const priorityColors = {
    low: 'bg-slate-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };

  const handleAnalyzeAll = async () => {
    await predictTraffic();
    await getRecommendations();
    await learnRoutes();
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Intelligence Trafic IA
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
        {lastAnalysis && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Dernière analyse: {formatDistanceToNow(lastAnalysis, { addSuffix: true, locale: fr })}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={activeTab === 'predictions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('predictions')}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Prédictions
          </Button>
          <Button 
            size="sm" 
            variant={activeTab === 'recommendations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('recommendations')}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-1" />
            Conseils
          </Button>
          <Button 
            size="sm" 
            variant={activeTab === 'routes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('routes')}
            className="flex-1"
          >
            <Route className="w-4 h-4 mr-1" />
            Routes
          </Button>
        </div>

        <ScrollArea className="h-[300px]">
          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-3">
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cliquez pour analyser le trafic</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={predictTraffic}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Analyser maintenant
                  </Button>
                </div>
              ) : (
                predictions.map((pred, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onZoneClick?.(pred.zone_lat, pred.zone_lng)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{pred.zone_name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(pred.confidence * 100)}% confiance
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">
                        {pred.predicted_demand} personnes prédites
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pred.reason}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune recommandation active</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => getRecommendations()}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Obtenir des conseils
                  </Button>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onZoneClick?.(rec.zone_lat, rec.zone_lng)}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-sm">{rec.title}</span>
                      <Badge className={`${priorityColors[rec.priority]} text-xs`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {rec.predicted_demand} demandes
                      </span>
                      <span>
                        Confiance: {Math.round(rec.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Learned Routes Tab */}
          {activeTab === 'routes' && (
            <div className="space-y-3">
              {learnedRoutes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune route apprise</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={learnRoutes}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Apprendre les routes
                  </Button>
                </div>
              ) : (
                learnedRoutes.map((route) => (
                  <div 
                    key={route.id}
                    className="p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {route.origin_name} → {route.destination_name}
                        </span>
                      </div>
                      {route.is_trending && (
                        <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Tendance
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{route.trip_count} trajets</span>
                      <span>Score: {route.popularity_score?.toFixed(1)}</span>
                      {route.avg_fare && <span>~{route.avg_fare} FCFA</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
