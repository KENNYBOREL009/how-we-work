import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useTransportBudget } from "@/hooks/useTransportBudget";
import { TransportBudgetCard } from "@/components/wallet/TransportBudgetCard";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, History, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Wallet = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { wallet, transactions, loading: walletLoading } = useWallet();
  const { activeBudget, createBudget, loading: budgetLoading } = useTransportBudget();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-20 h-20 rounded-full gradient-lokebo flex items-center justify-center mb-6 shadow-lg">
            <WalletIcon className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Wallet Transport</h1>
          <p className="text-muted-foreground text-center mb-6">
            Connectez-vous pour accéder à votre wallet.
          </p>
          <Button onClick={() => navigate("/auth")} className="rounded-xl">
            Se connecter
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (authLoading || walletLoading || budgetLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="safe-top px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">Wallet</span>
          <span className="text-foreground"> Transport</span>
        </h1>
        <p className="text-sm text-muted-foreground">Votre argent sanctuarisé</p>
      </header>

      {/* Balance Card */}
      <div className="mx-4 mb-6">
        <div className="gradient-lokebo rounded-2xl p-6 text-primary-foreground shadow-lg">
          <p className="text-sm opacity-80 mb-1">Solde disponible</p>
          <p className="text-4xl font-bold">
            {wallet?.balance.toLocaleString("fr-FR") || 0} <span className="text-xl">FCFA</span>
          </p>
        </div>
      </div>

      {/* Transport Budget */}
      <div className="px-4 mb-6">
        <TransportBudgetCard 
          activeBudget={activeBudget}
          onCreateBudget={createBudget}
          walletBalance={wallet?.balance || 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-14 rounded-xl text-base font-semibold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Recharger
          </Button>
          <Button variant="outline" className="h-14 rounded-xl text-base font-semibold" size="lg">
            <ArrowUpRight className="w-5 h-5 mr-2" />
            Transférer
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "credit" ? "bg-lokebo-success/20" : "bg-destructive/20"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="w-5 h-5 text-lokebo-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description || (tx.type === "credit" ? "Recharge" : "Paiement")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "d MMM yyyy, HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    tx.type === "credit" ? "text-lokebo-success" : "text-destructive"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Wallet;
