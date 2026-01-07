import React from 'react';
import { Coins, Crown, Map, Gift, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Reward } from '@/hooks/useRewards';
import type { UserPoints } from '@/hooks/useMapContributions';

interface RewardsMarketplaceProps {
  rewards: Reward[];
  userPoints: UserPoints | null;
  onRedeem: (rewardId: string, currentPoints: number) => Promise<boolean>;
  isLoading?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  credit: Coins,
  badge: Crown,
  service: Gift,
};

const categoryLabels: Record<string, string> = {
  credit: 'Crédit Course',
  badge: 'Badge & Statut',
  service: 'Services',
};

const RewardsMarketplace: React.FC<RewardsMarketplaceProps> = ({
  rewards,
  userPoints,
  onRedeem,
  isLoading,
}) => {
  const [redeemingId, setRedeemingId] = React.useState<string | null>(null);

  const handleRedeem = async (reward: Reward) => {
    if (!userPoints) return;
    
    setRedeemingId(reward.id);
    await onRedeem(reward.id, userPoints.current_points);
    setRedeemingId(null);
  };

  const groupedRewards = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) acc[reward.category] = [];
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points display */}
      {userPoints && (
        <div className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Points disponibles</div>
              <div className="text-3xl font-bold">{userPoints.current_points}</div>
            </div>
            <div className="text-5xl">🎁</div>
          </div>
        </div>
      )}

      {/* Rewards by category */}
      {Object.entries(groupedRewards).map(([category, categoryRewards]) => {
        const Icon = categoryIcons[category] || Gift;
        
        return (
          <div key={category} className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Icon className="w-5 h-5 text-primary" />
              {categoryLabels[category] || category}
            </h3>

            <div className="grid gap-3">
              {categoryRewards.map((reward) => {
                const canAfford = userPoints && userPoints.current_points >= reward.points_cost;
                const isRedeeming = redeemingId === reward.id;

                return (
                  <Card key={reward.id} className={cn(
                    'transition-all',
                    !canAfford && 'opacity-60'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                          category === 'credit' && 'bg-emerald-100 dark:bg-emerald-900/30',
                          category === 'badge' && 'bg-amber-100 dark:bg-amber-900/30',
                          category === 'service' && 'bg-blue-100 dark:bg-blue-900/30',
                        )}>
                          {reward.icon === 'coins' && '💰'}
                          {reward.icon === 'crown' && '👑'}
                          {reward.icon === 'map' && '🗺️'}
                          {!reward.icon && '🎁'}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{reward.name}</span>
                            {reward.value_fcfa && (
                              <Badge variant="secondary" className="text-xs">
                                {reward.value_fcfa} FCFA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {reward.description}
                          </p>
                        </div>

                        {/* Action */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary mb-1">
                            {reward.points_cost} pts
                          </div>
                          <Button
                            size="sm"
                            disabled={!canAfford || isRedeeming}
                            onClick={() => handleRedeem(reward)}
                          >
                            {isRedeeming ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Échanger'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {rewards.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune récompense disponible pour le moment</p>
        </div>
      )}
    </div>
  );
};

export default RewardsMarketplace;
