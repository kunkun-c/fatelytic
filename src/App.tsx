import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileGate from "@/components/ProfileGate";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Calculator from "./pages/Calculator";
import Result from "./pages/Result";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import History from "./pages/History";
import Disclaimer from "./pages/Disclaimer";
import EasternAstrology from "./pages/EasternAstrology";
import AuthCallback from "./pages/AuthCallback";
import ModulePage from "./pages/ModulePage";
import Overview from "./pages/Overview";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "fatelytic-query-cache",
});

const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 }}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Analytics />
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/calculator" element={<ProfileGate><Calculator /></ProfileGate>} />
                  <Route path="/numerology" element={<ProfileGate><Calculator /></ProfileGate>} />
                  <Route path="/result" element={<Result />} />
                  <Route path="/consultation" element={<ProfileGate><Chat /></ProfileGate>} />
                  <Route path="/explore" element={<ProfileGate><Dashboard /></ProfileGate>} />
                  <Route path="/chat" element={<Navigate to="/consultation" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/explore" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/eastern-astrology" element={<ProfileGate><EasternAstrology /></ProfileGate>} />
                  <Route path="/western-astrology" element={<ProfileGate><ModulePage moduleKey="western" /></ProfileGate>} />
                  <Route path="/tarot" element={<ProfileGate><ModulePage moduleKey="tarot" /></ProfileGate>} />
                  <Route path="/iching" element={<ProfileGate><ModulePage moduleKey="iching" /></ProfileGate>} />
                  <Route path="/career-ai" element={<ProfileGate><ModulePage moduleKey="career" /></ProfileGate>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </I18nProvider>
  </HelmetProvider>
);

export default App;
