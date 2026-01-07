import React from 'react';
import { Star, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserPoints } from '@/hooks/useMapContributions';

interface UserPointsCardProps {
  points: UserPoints | null;
  onViewRewards?: () => void;
  className?: string;
}

const levelIcons: Record<string, string> = {
  'Débutant': '🌱',
  'Contributeur Actif': '⭐',
  'Explorateur Local': '🗺️',
  'Explorateur Confirmé': '🧭',
  'Cartographe Expert': '🏆',
};

const UserPointsCard: React.FC<UserPointsCardProps> = ({ points, onViewRewards, className }) => {
  if (!points) {
    return (
      <div className={cn('bg-card border rounded-xl p-4', className)}>
        <div className="text-center text-muted-foreground text-sm">
          Connectez-vous pour voir vos points
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(
    (points.total_points / points.next_level_threshold) * 100,
    100
  );

  return (
    <div className={cn('bg-card border rounded-xl overflow-hidden', className)}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary to-primary/70 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{levelIcons[points.level_name] || '🌱'}</div>
            <div>
              <div className="text-sm opacity-90">Niveau</div>
              <div className="font-bold">{points.level_name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{points.current_points}</div>
            <div className="text-xs opacity-90">points disponibles</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{points.total_points} / {points.next_level_threshold}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium">{points.contributions_count}</div>
              <div className="text-xs text-muted-foreground">Contributions</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{points.validations_count}</div>
              <div className="text-xs text-muted-foreground">Validations</div>
            </div>
          </div>
        </div>

        {/* Rewards button */}
        {onViewRewards && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={onViewRewards}
          >
            <Star className="w-4 h-4 mr-2" />
            Voir les récompenses
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserPointsCard;
