import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusModeProvider } from "./hooks/useBusMode";
import { AuthProvider } from "./hooks/useAuth";
import { DriverModeProvider } from "./hooks/useDriverMode";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { OnboardingGuideProvider } from "./components/onboarding";
import Index from "./pages/Index";
import Signal from "./pages/Signal";
import Book from "./pages/Book";
import Wallet from "./pages/Wallet";
import Profil from "./pages/Profil";
import Bus from "./pages/Bus";
import Auth from "./pages/Auth";
import TripsHistory from "./pages/TripsHistory";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import ActiveTrip from "./pages/ActiveTrip";
import ScheduleTrip from "./pages/ScheduleTrip";
import Reservations from "./pages/Reservations";
import DriverPlanning from "./pages/DriverPlanning";
import DriverDashboard from "./pages/DriverDashboard";
import DriverDashboardV2 from "./pages/DriverDashboardV2";
import DriverClassicDashboard from "./pages/DriverClassicDashboard";
import DriverReports from "./pages/DriverReports";
import DriverAnalytics from "./pages/DriverAnalytics";
import Assistance from "./pages/Assistance";
import BecomeDriver from "./pages/BecomeDriver";
import About from "./pages/About";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import SharedComfortBooking from "./pages/SharedComfortBooking";
import Rewards from "./pages/Rewards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="lokebo-theme">
      <TooltipProvider>
        <AuthProvider>
          <DriverModeProvider>
            <BusModeProvider>
              <OnboardingGuideProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signal" element={<Signal />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/bus" element={<Bus />} />
                  <Route path="/history" element={<TripsHistory />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/notifications/settings" element={<NotificationSettings />} />
                  <Route path="/trip" element={<ActiveTrip />} />
                  <Route path="/schedule" element={<ScheduleTrip />} />
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/driver/planning" element={<DriverPlanning />} />
                  <Route path="/driver/dashboard" element={<DriverDashboard />} />
                  <Route path="/driver/reports" element={<DriverReports />} />
                  <Route path="/driver/analytics" element={<DriverAnalytics />} />
                  <Route path="/driver" element={<DriverDashboardV2 />} />
                  <Route path="/driver/classic" element={<DriverClassicDashboard />} />
                  <Route path="/assistance" element={<Assistance />} />
                  <Route path="/become-driver" element={<BecomeDriver />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/shared-comfort" element={<SharedComfortBooking />} />
                    <Route path="/rewards" element={<Rewards />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </OnboardingGuideProvider>
            </BusModeProvider>
          </DriverModeProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
