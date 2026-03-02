import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import PatientPortal from "./pages/PatientPortal";
import StaffManagement from "./pages/StaffManagement";
import DoctorProfile from "./pages/DoctorProfile";
import DoctorSchedule from "./pages/DoctorSchedule";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import DentalChartPage from "./pages/DentalChartPage";
import TreatmentPlansPage from "./pages/TreatmentPlansPage";
import InvoicesPage from "./pages/InvoicesPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";

const queryClient = new QueryClient();

// App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/staff" element={<StaffManagement />} />
              <Route path="/admin/profile" element={<DoctorProfile />} />
              <Route path="/admin/schedule" element={<DoctorSchedule />} />
              <Route path="/admin/dental-chart" element={<DentalChartPage />} />
              <Route path="/admin/treatment-plans" element={<TreatmentPlansPage />} />
              <Route path="/admin/invoices" element={<InvoicesPage />} />
              <Route path="/admin/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/portal" element={<PatientPortal />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
