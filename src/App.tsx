import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/toaster';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import Suppliers from './pages/Suppliers';
import Bills from './pages/Bills';
import Expenditures from './pages/Expenditures';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AppLayout } from './components/layout/AppLayout';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// App Routes Component
function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Transactions />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions/new" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <NewTransaction />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/add-transaction" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <NewTransaction />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/suppliers" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Suppliers />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bills" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Bills />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/expenditures" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Expenditures />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <Toaster />
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;