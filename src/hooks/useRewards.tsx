import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Reward {
  id: string;
  name: string;
  description?: string;
  category: 'credit' | 'badge' | 'service';
  points_cost: number;
  value_fcfa?: number;
  icon?: string;
  stock?: number;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  reward?: Reward;
}

export const useRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available rewards
  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

      if (error) throw error;
      setRewards(data as Reward[]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's redemptions
  const fetchRedemptions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data as RewardRedemption[]);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    }
  }, [user]);

  // Redeem a reward
  const redeemReward = async (rewardId: string, currentPoints: number): Promise<boolean> => {
    if (!user) {
      toast.error('Connectez-vous pour échanger vos points');
      return false;
    }

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      toast.error('Récompense introuvable');
      return false;
    }

    if (currentPoints < reward.points_cost) {
      toast.error(`Il vous manque ${reward.points_cost - currentPoints} points`);
      return false;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      toast.error('Récompense épuisée');
      return false;
    }

    try {
      // Create redemption record
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          points_spent: reward.points_cost,
        });

      if (redemptionError) throw redemptionError;

      // Deduct points (via RPC to avoid direct update)
      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          current_points: currentPoints - reward.points_cost,
        })
        .eq('user_id', user.id);

      if (pointsError) throw pointsError;

      // If it's a credit reward, add to wallet
      if (reward.category === 'credit' && reward.value_fcfa) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + reward.value_fcfa })
            .eq('id', wallet.id);

          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: wallet.id,
              amount: reward.value_fcfa,
              type: 'credit',
              description: `Échange récompense: ${reward.name}`,
            });
        }
      }

      toast.success(`🎉 ${reward.name} obtenu !`, {
        description: reward.category === 'credit' 
          ? `+${reward.value_fcfa} FCFA ajoutés à votre portefeuille`
          : 'Votre récompense a été activée',
      });

      await fetchRedemptions();
      return true;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Erreur lors de l\'échange');
      return false;
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (user) {
      fetchRedemptions();
    }
  }, [user, fetchRedemptions]);

  return {
    rewards,
    redemptions,
    isLoading,
    redeemReward,
    refreshRewards: fetchRewards,
    refreshRedemptions: fetchRedemptions,
  };
};
