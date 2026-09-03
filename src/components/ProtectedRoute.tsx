import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  /**
   * An RBAC catalogue code (`audit.read`). When present the route is gated on
   * `usePermissions().has(code, { allowReadOnly: true })` — the same check the
   * matching sidebar entry makes, so a nav link and its route can never
   * disagree about who may see the page (L-011).
   *
   * Optional and additive: every existing call site gates on `requiredRoles`
   * alone and is unaffected. The two may be combined, and then both must pass.
   */
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { has } = usePermissions();
  const location = useLocation();

  /** One denial panel, so both gates refuse in the same words. */
  const accessDenied = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Access Denied
        </h1>
        <p className="text-secondary-600">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return accessDenied;
    }
  }

  // Read-only variants pass: these are reading surfaces, and a user granted
  // `audit.read.readonly` may look without being able to change anything.
  if (requiredPermission && !has(requiredPermission, { allowReadOnly: true })) {
    return accessDenied;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
