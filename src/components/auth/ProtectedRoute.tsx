import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAccess, loading: authLoading } = useAuth();
  const { can, loading: permLoading } = usePermissions();

  // ── While AuthContext is restoring session from localStorage, show a
  //    blank spinner so we never redirect prematurely.  This is the
  //    primary fix for the "login loop" bug.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Not authenticated → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Role check (legacy)
  if (requiredRoles.length > 0 && !hasAccess(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── Permission check — skip while permissions are still loading to
  //    avoid a flash-redirect to /unauthorized on first render.
  if (requiredPermission && !permLoading && !can(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
