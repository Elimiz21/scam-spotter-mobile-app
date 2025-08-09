import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import SEOHead from "./components/SEOHead";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

import Home from "./pages/Home";
import GroupAnalysis from "./pages/GroupAnalysis";
import SingleCheck from "./pages/SingleCheck";
import ResultsDashboard from "./pages/ResultsDashboard";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletionPolicy from "./pages/DataDeletionPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import SecurityDashboard from "./components/SecurityDashboard";
import PerformanceMonitor from "./components/PerformanceMonitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <SEOHead
              title="ScamShield - Advanced Scam Detection & Protection"
              description="Protect yourself from online scams with our AI-powered detection platform. Real-time threat analysis, fraud prevention, and security monitoring."
            />
            <PWAInstallPrompt />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/analyze" element={<GroupAnalysis />} />
                <Route path="/check" element={<SingleCheck />} />
                <Route path="/results" element={<ResultsDashboard />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/data-deletion-policy" element={<DataDeletionPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/security" element={<SecurityDashboard />} />
                <Route path="/performance" element={<PerformanceMonitor />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
