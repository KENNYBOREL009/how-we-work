import MobileLayout from '@/components/layout/MobileLayout';
import UserPointsCard from '@/components/map-contributor/UserPointsCard';
import RewardsMarketplace from '@/components/map-contributor/RewardsMarketplace';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRewards } from '@/hooks/useRewards';
import { useMapContributions } from '@/hooks/useMapContributions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const Rewards = () => {
  const navigate = useNavigate();
  const { rewards, redemptions, isLoading, redeemReward } = useRewards();
  const { userPoints } = useMapContributions();

  return (
    <MobileLayout showNav={false} showThemeToggle>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Récompenses
            </h1>
            <p className="text-sm text-muted-foreground">
              Échangez vos Lokebo Points
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Points Card */}
          <div className="p-4">
            <UserPointsCard 
              points={userPoints} 
              onViewRewards={() => {}} 
            />
          </div>

          <Tabs defaultValue="shop" className="flex-1">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 px-4">
              <TabsTrigger
                value="shop"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Gift className="w-4 h-4 mr-2" />
                Boutique
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <History className="w-4 h-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shop" className="p-4 mt-0">
              <RewardsMarketplace 
                rewards={rewards}
                userPoints={userPoints}
                onRedeem={redeemReward}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="history" className="p-4 mt-0 space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : redemptions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Aucun échange pour le moment
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Vos récompenses échangées apparaîtront ici
                    </p>
                  </CardContent>
                </Card>
              ) : (
                redemptions.map((redemption) => (
                  <Card key={redemption.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                            {redemption.reward?.icon || '🎁'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {redemption.reward?.name || 'Récompense'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(redemption.created_at),
                                'dd MMM yyyy à HH:mm',
                                { locale: fr }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              redemption.status === 'completed'
                                ? 'default'
                                : redemption.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {redemption.status === 'completed'
                              ? 'Utilisé'
                              : redemption.status === 'pending'
                              ? 'En attente'
                              : 'Annulé'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            -{redemption.points_spent} pts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Rewards;
