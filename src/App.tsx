import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusModeProvider } from "./hooks/useBusMode";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Signal from "./pages/Signal";
import Wallet from "./pages/Wallet";
import Profil from "./pages/Profil";
import Bus from "./pages/Bus";
import Auth from "./pages/Auth";
import TripsHistory from "./pages/TripsHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BusModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signal" element={<Signal />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/bus" element={<Bus />} />
              <Route path="/history" element={<TripsHistory />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BusModeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
