import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useTransportBudget } from "@/hooks/useTransportBudget";
import { TransportBudgetCard } from "@/components/wallet/TransportBudgetCard";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, History, Loader2, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Wallet = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { wallet, transactions, loading: walletLoading } = useWallet();
  const { activeBudget, createBudget, loading: budgetLoading } = useTransportBudget();

  // Demo mode for non-authenticated users
  const isDemo = !user;
  const demoBalance = 25000;
  const demoTransactions = [
    { id: "1", type: "debit", amount: 1500, description: "Course Akwa → Bonanjo", created_at: new Date().toISOString() },
    { id: "2", type: "credit", amount: 10000, description: "Recharge Mobile Money", created_at: new Date(Date.now() - 86400000).toISOString() },
  ];

  const displayBalance = isDemo ? demoBalance : (wallet?.balance || 0);
  const displayTransactions = isDemo ? demoTransactions : transactions;

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
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-sm text-muted-foreground">Gérez votre argent transport</p>
        </header>

        {/* Balance Card */}
        <div className="px-4 mb-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lokebo-dark to-gray-900 p-6 text-white shadow-elevated">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                    <WalletIcon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Solde disponible</p>
                    {isDemo && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Mode démo</span>
                    )}
                  </div>
                </div>
                <CreditCard className="w-8 h-8 text-white/30" />
              </div>
              
              <p className="text-4xl font-bold tracking-tight">
                {displayBalance.toLocaleString("fr-FR")}
                <span className="text-xl font-normal text-white/70 ml-2">FCFA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="h-14 gap-3">
              <Plus className="w-5 h-5" />
              Recharger
            </Button>
            <Button variant="outline" size="lg" className="h-14 gap-3">
              <ArrowUpRight className="w-5 h-5" />
              Transférer
            </Button>
          </div>
        </div>

        {/* Transport Budget */}
        {!isDemo && (
          <div className="px-4 mb-6">
            <TransportBudgetCard 
              activeBudget={activeBudget}
              onCreateBudget={createBudget}
              walletBalance={wallet?.balance || 0}
            />
          </div>
        )}

        {/* Transactions */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <History className="w-4 h-4" />
              Transactions récentes
            </h2>
          </div>

          {displayTransactions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-muted/30 border border-border">
              <WalletIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Aucune transaction</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        tx.type === "credit" 
                          ? "bg-lokebo-success/10" 
                          : "bg-muted"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-lokebo-success" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.description || (tx.type === "credit" ? "Recharge" : "Paiement")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "d MMM, HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold text-sm ${
                      tx.type === "credit" ? "text-lokebo-success" : "text-foreground"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Login prompt for demo mode */}
        {isDemo && (
          <div className="px-4 pb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Se connecter pour accéder à toutes les fonctionnalités
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Wallet;
