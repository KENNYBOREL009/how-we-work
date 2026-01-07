import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Wallet {
  id: string;
  balance: number;
  locked_amount: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
    } else {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      console.error("Error fetching wallet:", walletError);
    } else if (walletData) {
      setWallet({
        ...walletData,
        locked_amount: walletData.locked_amount || 0
      });
      
      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txError) {
        console.error("Error fetching transactions:", txError);
      } else {
        setTransactions(txData as Transaction[] || []);
      }
    }
    
    setLoading(false);
  };

  const availableBalance = wallet ? wallet.balance - (wallet.locked_amount || 0) : 0;

  return {
    wallet,
    transactions,
    loading,
    availableBalance,
    refetch: fetchWallet,
  };
};
