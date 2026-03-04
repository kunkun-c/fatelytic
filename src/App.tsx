import { Suspense, lazy, type ReactNode, useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileGate from "@/components/ProfileGate";
import Layout from "@/components/Layout";

const Index = lazy(() => import("./pages/Index"));
const Overview = lazy(() => import("./pages/Overview"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Result = lazy(() => import("./pages/Result"));
const Chat = lazy(() => import("./pages/Chat"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const EasternAstrology = lazy(() => import("./pages/EasternAstrology"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const Topup = lazy(() => import("./pages/Topup"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="container mx-auto flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
    </div>
  );
}

function SuspendedRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

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

function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false);
  const [AnalyticsComponent, setAnalyticsComponent] = useState<null | React.ComponentType>(null);

  useEffect(() => {
    const cb = () => setEnabled(true);

    if (typeof window === "undefined") return;
    if ("requestIdleCallback" in globalThis) {
      (globalThis as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb);
      return;
    }

    const t = setTimeout(cb, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    void (async () => {
      try {
        const mod = await import("@vercel/analytics/react");
        if (!alive) return;
        setAnalyticsComponent(() => mod.Analytics);
      } catch {
        if (!alive) return;
        setAnalyticsComponent(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled]);

  if (!enabled || !AnalyticsComponent) return null;
  return <AnalyticsComponent />;
}

const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 }}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <DeferredAnalytics />
              <Layout>
                <Routes>
                  <Route path="/" element={<SuspendedRoute><Index /></SuspendedRoute>} />
                  <Route path="/overview" element={<SuspendedRoute><Overview /></SuspendedRoute>} />
                  <Route path="/calculator" element={<SuspendedRoute><ProfileGate><Calculator /></ProfileGate></SuspendedRoute>} />
                  <Route path="/numerology" element={<SuspendedRoute><ProfileGate><Calculator /></ProfileGate></SuspendedRoute>} />
                  <Route path="/result" element={<SuspendedRoute><Result /></SuspendedRoute>} />
                  <Route path="/consultation" element={<SuspendedRoute><ProfileGate><Chat /></ProfileGate></SuspendedRoute>} />
                  <Route path="/explore" element={<SuspendedRoute><ProfileGate><Dashboard /></ProfileGate></SuspendedRoute>} />
                  <Route path="/chat" element={<Navigate to="/consultation" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/explore" replace />} />
                  <Route path="/login" element={<SuspendedRoute><Login /></SuspendedRoute>} />
                  <Route path="/auth/callback" element={<SuspendedRoute><AuthCallback /></SuspendedRoute>} />
                  <Route path="/history" element={<SuspendedRoute><ProtectedRoute><History /></ProtectedRoute></SuspendedRoute>} />
                  <Route path="/profile" element={<SuspendedRoute><ProtectedRoute><Profile /></ProtectedRoute></SuspendedRoute>} />
                  <Route path="/topup" element={<SuspendedRoute><ProtectedRoute><Topup /></ProtectedRoute></SuspendedRoute>} />
                  <Route path="/disclaimer" element={<SuspendedRoute><Disclaimer /></SuspendedRoute>} />
                  <Route path="/terms" element={<SuspendedRoute><Terms /></SuspendedRoute>} />
                  <Route path="/privacy" element={<SuspendedRoute><Privacy /></SuspendedRoute>} />
                  <Route path="/eastern-astrology" element={<SuspendedRoute><ProfileGate><EasternAstrology /></ProfileGate></SuspendedRoute>} />
                  <Route path="/western-astrology" element={<SuspendedRoute><ProfileGate><ModulePage moduleKey="western" /></ProfileGate></SuspendedRoute>} />
                  <Route path="/tarot" element={<SuspendedRoute><ProfileGate><ModulePage moduleKey="tarot" /></ProfileGate></SuspendedRoute>} />
                  <Route path="/iching" element={<SuspendedRoute><ProfileGate><ModulePage moduleKey="iching" /></ProfileGate></SuspendedRoute>} />
                  <Route path="/career-ai" element={<SuspendedRoute><ProfileGate><ModulePage moduleKey="career" /></ProfileGate></SuspendedRoute>} />
                  <Route path="*" element={<SuspendedRoute><NotFound /></SuspendedRoute>} />
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
