import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { submitData, syncQueue } from "./lib/submitAndSync";
import { apiClient, checkBackendVersion } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import EditTransaction from "./pages/EditTransaction";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Expenditures from "./pages/Expenditures";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Import PWA components
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ConnectionStatus from "./components/ConnectionStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const FRONTEND_VERSION = '1.0.0'; // TODO: Update with your real frontend version

function AppContent() {
  const { loading, user } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkBackendVersion(FRONTEND_VERSION, () => setShowUpdate(true));
  }, []);

  // Remove backendUrlError and checkingBackendUrl state

  // Remove useEffect that calls apiClient.refreshBaseUrl

  // Remove handleRefreshBackendUrl function

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading application..." size="lg" />
      </div>
    );
  }

  // Compulsory login: if not authenticated, always redirect to /login
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and on /login, redirect to dashboard
  if (user && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // Render the app without backend connection error banner
  return (
    <>
      <ConnectionStatus />
      {showUpdate && (
        <div className="fixed top-0 left-0 w-full bg-yellow-400 text-black p-4 z-50 text-center">
          A new version is available. <button onClick={() => window.location.reload()} className="underline font-bold">Refresh</button>
        </div>
      )}
      <Routes>
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Protected main app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        {/* Transaction routes - accessible by all roles */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/new"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <NewTransaction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id/edit"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <EditTransaction />
            </ProtectedRoute>
          }
        />
        {/* Supplier routes - admin and owner only */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner"]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/:id"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner"]}>
              <SupplierDetails />
            </ProtectedRoute>
          }
        />
        {/* Financial routes - admin and owner only */}
        <Route
          path="/expenditures"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner"]}>
              <Expenditures />
            </ProtectedRoute>
          }
        />
        {/* Bill routes - accessible by all roles */}
        <Route
          path="/bills"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <Bills />
            </ProtectedRoute>
          }
        />
        {/* Report routes - admin and owner only */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="callmemobiles-theme">
        <LanguageProvider>
          <ConnectionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter basename="/expensoo-clean">
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
