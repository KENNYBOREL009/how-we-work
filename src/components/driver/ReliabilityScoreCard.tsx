import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverReliabilityScore } from "@/types";
import { DRIVER_RELIABILITY } from "@/lib/constants";

interface ReliabilityScoreCardProps {
  score: DriverReliabilityScore;
}

export const ReliabilityScoreCard = ({ score }: ReliabilityScoreCardProps) => {
  const getScoreColor = () => {
    if (score.reliability_score >= DRIVER_RELIABILITY.SCORE_EXCELLENT) return "text-lokebo-success";
    if (score.reliability_score >= DRIVER_RELIABILITY.SCORE_GOOD) return "text-green-500";
    if (score.reliability_score >= DRIVER_RELIABILITY.SCORE_WARNING) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Score de Fiabilité
          </h3>
          <span className={cn("text-2xl font-bold", getScoreColor())}>
            {score.reliability_score}%
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Taux d'acceptation</span>
              <span className="font-medium">{score.acceptance_rate}%</span>
            </div>
            <Progress value={score.acceptance_rate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Ponctualité</span>
              <span className="font-medium">{score.punctuality_score}%</span>
            </div>
            <Progress value={score.punctuality_score} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
            <span className="text-muted-foreground">Courses effectuées</span>
            <span className="font-medium">
              {score.completed_trips}/{score.total_scheduled_trips}
            </span>
          </div>

          {/* Penalty counts */}
          {(score.cancellation_count > 0 || score.ghosting_count > 0) && (
            <div className="flex items-center gap-4 text-xs pt-2 border-t border-border/50">
              {score.cancellation_count > 0 && (
                <span className="text-amber-500">
                  {score.cancellation_count} annulation(s)
                </span>
              )}
              {score.ghosting_count > 0 && (
                <span className="text-destructive">
                  {score.ghosting_count} no-show(s)
                </span>
              )}
            </div>
          )}
        </div>

        {score.is_scheduling_blocked && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Accès aux réservations programmées bloqué
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
