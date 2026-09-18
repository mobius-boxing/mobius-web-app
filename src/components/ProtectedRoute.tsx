import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Skeleton } from './ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** An RBAC catalogue code that permits this read surface. */
  requiredPermission?: string;
}

export const DEVICE_PENDING_PATH = '/device-pending';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, deviceBlocked } = useAuth();
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
        <Skeleton lines={6} className="max-w-3xl w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // A member on a browser the company has not approved can reach nothing but the
  // waiting screen, which is itself behind this guard — hence the path check: the
  // alternative, leaving /device-pending unprotected, would render it to anonymous
  // visitors. Before the role/permission gates, because "your browser is not
  // approved" is the accurate answer even on a page the member could not see anyway.
  if (deviceBlocked && location.pathname !== DEVICE_PENDING_PATH) {
    return <Navigate to={DEVICE_PENDING_PATH} state={{ from: location }} replace />;
  }

  // Read-only variants pass: these are reading surfaces, and a user granted
  // `audit.read.readonly` may look without being able to change anything.
  if (requiredPermission && !has(requiredPermission, { allowReadOnly: true })) {
    return accessDenied;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
