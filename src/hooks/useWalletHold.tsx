import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface WalletHold {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export const useWalletHold = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkAvailableBalance = async (requiredAmount: number): Promise<boolean> => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return false;
    }

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("balance, locked_amount")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !wallet) {
      console.error("Error checking balance:", error);
      return false;
    }

    const availableBalance = (wallet.balance || 0) - (wallet.locked_amount || 0);
    return availableBalance >= requiredAmount;
  };

  const createHold = async (
    amount: number, 
    reason: string, 
    tripId?: string
  ): Promise<string | null> => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("create_wallet_hold", {
        p_user_id: user.id,
        p_amount: amount,
        p_reason: reason,
        p_trip_id: tripId || null,
      });

      if (error) {
        if (error.message.includes("Insufficient")) {
          toast.error("Solde insuffisant", {
            description: `Vous avez besoin de ${amount} FCFA disponibles pour cette réservation.`,
          });
        } else {
          toast.error("Erreur de réservation", {
            description: error.message,
          });
        }
        return null;
      }

      return data as string;
    } catch (err) {
      console.error("Error creating hold:", err);
      toast.error("Erreur lors de la création de la caution");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const releaseHold = async (
    holdId: string,
    applyPenalty: boolean = false,
    penaltyPercent: number = 0,
    penaltyReason?: string
  ): Promise<boolean> => {
    setLoading(true);

    try {
      const { error } = await supabase.rpc("release_wallet_hold", {
        p_hold_id: holdId,
        p_apply_penalty: applyPenalty,
        p_penalty_percent: penaltyPercent,
        p_penalty_reason: penaltyReason || null,
      });

      if (error) {
        console.error("Error releasing hold:", error);
        toast.error("Erreur lors de la libération de la caution");
        return false;
      }

      if (applyPenalty && penaltyPercent > 0) {
        toast.error("Pénalité appliquée", {
          description: penaltyReason || "Une pénalité a été prélevée de votre portefeuille.",
        });
      }

      return true;
    } catch (err) {
      console.error("Error releasing hold:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getActiveHolds = async (): Promise<WalletHold[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("wallet_holds")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching holds:", error);
      return [];
    }

    return (data || []).map((hold: any) => ({
      id: hold.id,
      amount: hold.amount,
      reason: hold.reason,
      status: hold.status,
      createdAt: hold.created_at,
    }));
  };

  return {
    loading,
    checkAvailableBalance,
    createHold,
    releaseHold,
    getActiveHolds,
  };
};
