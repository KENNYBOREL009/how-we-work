import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface MomoTransaction {
  id: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  referenceId: string;
  createdAt: string;
}

interface UseMobileMoneyReturn {
  isProcessing: boolean;
  transactions: MomoTransaction[];
  initiateDeposit: (phoneNumber: string, amount: number) => Promise<string | null>;
  checkTransactionStatus: (transactionId: string) => Promise<string>;
  fetchTransactions: () => Promise<void>;
}

export const useMobileMoney = (): UseMobileMoneyReturn => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<MomoTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('momo_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setTransactions((data || []).map(t => ({
        id: t.id,
        phoneNumber: t.phone_number,
        amount: Number(t.amount),
        status: t.status as MomoTransaction['status'],
        referenceId: t.reference_id || '',
        createdAt: t.created_at
      })));
    } catch (error) {
      console.error("Error fetching MoMo transactions:", error);
    }
  }, [user]);

  const initiateDeposit = useCallback(async (
    phoneNumber: string, 
    amount: number
  ): Promise<string | null> => {
    if (!user) {
      toast.error("Veuillez vous connecter");
      return null;
    }

    // Validate phone number (Cameroon MTN format)
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^(6[5-9]\d{7}|237[5-9]\d{7})$/.test(cleanPhone)) {
      toast.error("Numéro MTN invalide", {
        description: "Format attendu: 6XXXXXXXX"
      });
      return null;
    }

    // Validate amount (minimum 100 XAF)
    if (amount < 100) {
      toast.error("Montant minimum: 100 FCFA");
      return null;
    }

    setIsProcessing(true);

    try {
      // Get user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        toast.error("Portefeuille non trouvé");
        return null;
      }

      // Create transaction record
      const { data: transaction, error } = await supabase
        .from('momo_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          phone_number: cleanPhone,
          amount: amount,
          status: 'pending',
          transaction_type: 'deposit'
        })
        .select()
        .single();

      if (error) throw error;

      // In sandbox mode, simulate the MoMo flow
      // In production, this would call the actual MTN MoMo API
      toast.info("Demande de paiement envoyée", {
        description: "Vérifiez votre téléphone pour le code USSD"
      });

      // Simulate processing (in real implementation, this would be handled by webhook)
      setTimeout(async () => {
        // Simulate successful payment for demo
        const { error: updateError } = await supabase
          .from('momo_transactions')
          .update({ 
            status: 'success',
            callback_received_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (!updateError) {
          // Get current wallet balance and add funds
          const { data: currentWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', wallet.id)
            .single();

          if (currentWallet) {
            await supabase
              .from('wallets')
              .update({ 
                balance: (currentWallet.balance || 0) + amount
              })
              .eq('id', wallet.id);
          }

          // Create transaction record
          await supabase.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            amount: amount,
            type: 'credit',
            description: `Dépôt MTN MoMo - ${cleanPhone}`
          });

          toast.success("Dépôt réussi !", {
            description: `${amount.toLocaleString()} FCFA ajoutés à votre portefeuille`
          });

          fetchTransactions();
        }
      }, 5000); // 5 second delay to simulate USSD process

      return transaction.id;
    } catch (error) {
      console.error("Error initiating MoMo deposit:", error);
      toast.error("Erreur lors du dépôt");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, fetchTransactions]);

  const checkTransactionStatus = useCallback(async (
    transactionId: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('momo_transactions')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      return data?.status || 'unknown';
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return 'error';
    }
  }, []);

  return {
    isProcessing,
    transactions,
    initiateDeposit,
    checkTransactionStatus,
    fetchTransactions
  };
};
