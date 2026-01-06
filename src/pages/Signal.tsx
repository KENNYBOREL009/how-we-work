import MobileLayout from "@/components/layout/MobileLayout";
import { Radio } from "lucide-react";

const Signal = () => {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-20 h-20 rounded-full gradient-lokebo flex items-center justify-center mb-6 shadow-lg">
          <Radio className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Signal</h1>
        <p className="text-muted-foreground text-center">
          Émettez votre intention de trajet pour attirer les chauffeurs.
        </p>
      </div>
    </MobileLayout>
  );
};

export default Signal;
