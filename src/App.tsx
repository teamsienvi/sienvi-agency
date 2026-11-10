import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AuthErrorHandler } from "@/components/AuthErrorHandler";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminClients = lazy(() => import("./pages/AdminClients"));
const AdminClientWorkspace = lazy(() => import("./pages/AdminClientWorkspace"));
const AdminCreateClient = lazy(() => import("./pages/AdminCreateClient"));
const AdminBilling = lazy(() => import("./pages/AdminBilling"));
const Success = lazy(() => import("./pages/Success"));
const SelectServices = lazy(() => import("./pages/SelectServices"));
const CheckoutSummary = lazy(() => import("./pages/CheckoutSummary"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Contract = lazy(() => import("./pages/Contract"));
const Join = lazy(() => import("./pages/Join"));
const Referral = lazy(() => import("./pages/Referral"));
const UgcAiInfluencer = lazy(() => import("./pages/UgcAiInfluencer"));

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsProvider>
          <AuthErrorHandler />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/join" element={<Join />} />
              <Route path="/success" element={<Success />} />
              <Route path="/select-services" element={<SelectServices />} />
              <Route path="/checkout-summary" element={<CheckoutSummary />} />
              <Route path="/dashboard" element={<ClientDashboard />} />
              <Route path="/login" element={<ClientLogin />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/contract" element={<Contract />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/clients/:id" element={<AdminClientWorkspace />} />
              <Route path="/admin/create-client" element={<AdminCreateClient />} />
              <Route path="/admin/billing" element={<AdminBilling />} />
              <Route path="/ugc-ai-influencer" element={<UgcAiInfluencer />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnalyticsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;