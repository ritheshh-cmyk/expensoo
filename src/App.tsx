import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
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

// ── Suspense fallback — shown while a page chunk is downloading ───────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

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
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Dashboard /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Transactions /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions/new" element={
        <ProtectedRoute><AppLayout><AnimatedPage><NewTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/add-transaction" element={
        <ProtectedRoute><AppLayout><AnimatedPage><NewTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/sales/new" element={
        <ProtectedRoute><AppLayout><AnimatedPage><SalesTransaction /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/suppliers" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Suppliers /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/bills" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Bills /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/expenditures" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Expenditures /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Reports /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Settings /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><AnimatedPage><Profile /></AnimatedPage></AppLayout></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute><AppLayout><AnimatedPage><AdminPage /></AnimatedPage></AppLayout></ProtectedRoute>
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