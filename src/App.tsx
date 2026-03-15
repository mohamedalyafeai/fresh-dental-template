import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const DoctorSchedule = lazy(() => import("./pages/DoctorSchedule"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DentalChartPage = lazy(() => import("./pages/DentalChartPage"));
const TreatmentPlansPage = lazy(() => import("./pages/TreatmentPlansPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const PrescriptionsPage = lazy(() => import("./pages/PrescriptionsPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
