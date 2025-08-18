import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { submitData, syncQueue } from "./lib/submitAndSync";
import { apiClient, checkBackendVersion } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RoleBasedAccessProvider } from "@/components/RoleBasedAccess";
import RealtimeDashboardDemo from "@/components/RealtimeDashboardDemo";
import RealtimeDashboard from "@/components/RealtimeDashboard";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import RealtimeInventory from "@/components/RealtimeInventory";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import EditTransaction from "./pages/EditTransaction";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Expenditures from "./pages/Expenditures";
import ExpenditureManagement from "./pages/ExpenditureManagement";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Import PWA components
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ConnectionStatus from "./components/ConnectionStatus";

// Register service worker for PWA functionality (manual registration)
// Initialize PWA service worker without virtual imports
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('✅ Service worker registered successfully');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              if (window.confirm('🔄 New version available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
      staleTime: 30 * 60 * 1000, // 30 minutes - keep data fresh longer
      gcTime: 60 * 60 * 1000, // 1 hour - cache longer for offline support
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Use cached data when available
      refetchOnReconnect: true, // Refetch when network reconnects
      networkMode: 'offlineFirst', // Prioritize cached data
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const FRONTEND_VERSION = '1.0.0'; // TODO: Update with your real frontend version

function AppContent() {
  const { loading, user } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only check backend version if user is authenticated and token is available
    if (user) {
      // Add delay to ensure authentication is fully established
      const timer = setTimeout(async () => {
        const token = localStorage.getItem("callmemobiles_token");
        if (token && user) {
          // Additional delay to ensure backend is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Double-check token and user are still available
          const currentToken = localStorage.getItem("callmemobiles_token");
          if (currentToken && user) {
            checkBackendVersion(FRONTEND_VERSION, () => setShowUpdate(true));
          }
        }
      }, 2000); // Wait 2 seconds after user is set
      
      return () => clearTimeout(timer);
    }
  }, [user]);

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
      <RealtimeNotifications />
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
        {/* Real-time Demo Dashboard Route */}
        <Route
          path="/realtime-demo"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <RealtimeDashboardDemo />
            </ProtectedRoute>
          }
        />
        {/* Real-time Dashboard Route */}
        <Route
          path="/realtime-dashboard"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <RealtimeDashboard />
            </ProtectedRoute>
          }
        />
        {/* Real-time Inventory Route */}
        <Route
          path="/realtime-inventory"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <RealtimeInventory />
            </ProtectedRoute>
          }
        />
        {/* Live Activity Feed Route */}
        <Route
          path="/activity-feed"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <LiveActivityFeed />
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
        <Route
          path="/expenditure-management"
          element={
            <ProtectedRoute requiredRoles={["admin", "owner", "worker"]}>
              <ExpenditureManagement />
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
        <DeviceProvider debugMode={process.env.NODE_ENV === 'development'}>
          <LanguageProvider>
            <ConnectionProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter basename="/">
                  <AuthProvider>
                    <RoleBasedAccessProvider>
                      <AppContent />
                    </RoleBasedAccessProvider>
                  </AuthProvider>
                </BrowserRouter>
              </TooltipProvider>
            </ConnectionProvider>
          </LanguageProvider>
        </DeviceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
