import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusModeProvider } from "./hooks/useBusMode";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import Index from "./pages/Index";
import Signal from "./pages/Signal";
import Wallet from "./pages/Wallet";
import Profil from "./pages/Profil";
import Bus from "./pages/Bus";
import Auth from "./pages/Auth";
import TripsHistory from "./pages/TripsHistory";
import Notifications from "./pages/Notifications";
import ActiveTrip from "./pages/ActiveTrip";
import ScheduleTrip from "./pages/ScheduleTrip";
import Reservations from "./pages/Reservations";
import DriverPlanning from "./pages/DriverPlanning";
import Assistance from "./pages/Assistance";
import BecomeDriver from "./pages/BecomeDriver";
import About from "./pages/About";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="lokebo-theme">
      <TooltipProvider>
        <AuthProvider>
          <BusModeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signal" element={<Signal />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/profil" element={<Profil />} />
                <Route path="/bus" element={<Bus />} />
                <Route path="/history" element={<TripsHistory />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/trip" element={<ActiveTrip />} />
                <Route path="/schedule" element={<ScheduleTrip />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/driver/planning" element={<DriverPlanning />} />
                <Route path="/assistance" element={<Assistance />} />
                <Route path="/become-driver" element={<BecomeDriver />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BusModeProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
