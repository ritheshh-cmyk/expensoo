import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './App.css';

// ── Lazy-loaded page chunks (each page becomes its own JS chunk) ───────────
const Login        = React.lazy(() => import('./pages/auth/Login'));
const Dashboard    = React.lazy(() => import('./pages/Dashboard'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const NewTransaction = React.lazy(() => import('./pages/NewTransaction'));
const Suppliers    = React.lazy(() => import('./pages/Suppliers'));
const Bills        = React.lazy(() => import('./pages/Bills'));
const Expenditures = React.lazy(() => import('./pages/Expenditures'));
const Reports      = React.lazy(() => import('./pages/Reports'));
const Settings     = React.lazy(() => import('./pages/Settings'));
const Profile      = React.lazy(() => import('./pages/Profile'));
const AdminPage    = React.lazy(() => import('./pages/AdminPage'));
const SalesTransaction = React.lazy(() => import('./pages/SalesTransaction'));
const EditTransaction  = React.lazy(() => import('./pages/EditTransaction'));
const Manual         = React.lazy(() => import('./pages/Manual'));
const Unauthorized   = React.lazy(() => import('./pages/Unauthorized'));

// ── Suspense fallback — shown while a page chunk is downloading ───────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────────────────────
// We use the imported ProtectedRoute from src/components/auth/ProtectedRoute

// ── Animated page wrapper ─────────────────────────────────────────────────────
// Re-mounts every time the route changes → CSS animation replays automatically.
function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}

// ── App Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, loading: authLoading } = useAuth();

  // While AuthContext is initialising (reading localStorage + verifying token),
  // render a full-screen spinner instead of making any routing decisions.
  // This is the second guard against the login redirect loop — the first is
  // inside ProtectedRoute itself.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      {/* Placeholder for the forgot-password link inside Login.tsx */}
      <Route
        path="/auth/forgot-password"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route path="/dashboard" element={
        <ProtectedRoute requiredPermission="dashboard.view"><AppLayout><AnimatedPage><Dashboard /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions" element={
        <ProtectedRoute requiredPermission="transactions.view"><AppLayout><AnimatedPage><Transactions /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions/new" element={
        <ProtectedRoute requiredPermission="transactions.edit"><AppLayout><AnimatedPage><NewTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions/:id/edit" element={
        <ProtectedRoute requiredPermission="transactions.edit"><AppLayout><AnimatedPage><EditTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/add-transaction" element={
        <ProtectedRoute requiredPermission="transactions.edit"><AppLayout><AnimatedPage><NewTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/sales" element={
        <ProtectedRoute requiredPermission="transactions.edit"><AppLayout><AnimatedPage><SalesTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/suppliers" element={
        <ProtectedRoute requiredPermission="suppliers.view"><AppLayout><AnimatedPage><Suppliers /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/bills" element={
        <ProtectedRoute requiredPermission="transactions.view"><AppLayout><AnimatedPage><Bills /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/expenditures" element={
        <ProtectedRoute requiredPermission="transactions.view"><AppLayout><AnimatedPage><Expenditures /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute requiredPermission="reports.view"><AppLayout><AnimatedPage><Reports /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Settings /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Profile /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredRoles={['admin']}><AppLayout><AnimatedPage><AdminPage /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/manual" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Manual /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      {/* Dedicated unauthorized page */}
      <Route path="/unauthorized" element={
        <Suspense fallback={<PageLoader />}><Unauthorized /></Suspense>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="callmemobiles-theme">
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <AppRoutes />
              <Toaster />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;