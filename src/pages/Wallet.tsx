import MobileLayout from "@/components/layout/MobileLayout";
import { Wallet as WalletIcon } from "lucide-react";

const Wallet = () => {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-20 h-20 rounded-full gradient-lokebo flex items-center justify-center mb-6 shadow-lg">
          <WalletIcon className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Wallet Transport</h1>
        <p className="text-muted-foreground text-center">
          Votre argent sanctuarisé pour vos déplacements.
        </p>
      </div>
    </MobileLayout>
  );
};

export default Wallet;
