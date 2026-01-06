import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";

interface PassengerSelectorProps {
  count: number;
  onChange: (count: number) => void;
  maxPassengers?: number;
  totalPrice: number;
}

export const PassengerSelector = ({ count, onChange, maxPassengers = 4, totalPrice }: PassengerSelectorProps) => {
  const pricePerPerson = Math.round(totalPrice / count);
  const savings = count > 1 ? Math.round((1 - pricePerPerson / totalPrice) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">Partager le trajet</span>
      </div>

      {/* Passenger count pills */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: maxPassengers }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={cn(
              "flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
              count === num
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-center">
              {num === 1 ? (
                <User className="w-5 h-5" />
              ) : (
                <div className="flex -space-x-1">
                  {Array.from({ length: Math.min(num, 3) }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-current opacity-75" />
                  ))}
                  {num > 3 && <span className="text-xs ml-1">+</span>}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold">{num}</span>
          </button>
        ))}
      </div>

      {/* Price summary */}
      <div className={cn(
        "p-4 rounded-xl transition-colors",
        count > 1 ? "bg-lokebo-success/10 border border-lokebo-success/30" : "bg-muted"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {count > 1 ? "Votre part" : "Prix total"}
            </p>
            <p className={cn(
              "text-2xl font-bold",
              count > 1 ? "text-lokebo-success" : "text-foreground"
            )}>
              {pricePerPerson.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
            </p>
          </div>
          {count > 1 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Économie</p>
              <p className="text-xl font-bold text-lokebo-success">-{savings}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
