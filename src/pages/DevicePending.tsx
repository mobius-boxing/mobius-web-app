import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

/**
 * The waiting screen for a member whose browser is not approved yet.
 *
 * No <Layout>: the sidebar's own data (the company switcher, the nav's entities)
 * is exactly what the device gate refuses.
 */
const DevicePending: React.FC = () => {
  const { t } = useTranslation();
  const { device, deviceBlocked, refreshDevice, logout } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  if (!deviceBlocked) {
    // Approval resumes the journey the gate interrupted (ProtectedRoute forwards it
    // as `from`, the same convention the login page uses).
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const checkNow = async () => {
    setChecking(true);
    try {
      await refreshDevice();
    } catch {
      // The poll keeps running; a failed manual check needs no separate error surface.
    } finally {
      setChecking(false);
    }
  };

  const body = () => {
    if (device?.status === 'revoked') {
      return (
        <>
          <h1 className="text-2xl font-bold text-secondary-900">{t('devices.waiting.revokedTitle')}</h1>
          <p className="mt-2 text-secondary-600">{t('devices.waiting.revokedMessage')}</p>
        </>
      );
    }

    // `device: null` for a member means the API has no row for this browser — the
    // same situation as a 403 DEVICE_UNKNOWN, and only a fresh login mints one.
    if (!device) {
      return (
        <>
          <h1 className="text-2xl font-bold text-secondary-900">{t('devices.waiting.unknownTitle')}</h1>
          <p className="mt-2 text-secondary-600">{t('devices.waiting.unknownMessage')}</p>
        </>
      );
    }

    return (
      <>
        <h1 className="text-2xl font-bold text-secondary-900">{t('devices.waiting.title')}</h1>
        <p className="mt-2 text-secondary-600">{t('devices.waiting.instructions')}</p>
        <p className="mt-4 text-sm text-secondary-500">{t('devices.waiting.help')}</p>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-secondary-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <ShieldCheck className="h-6 w-6 text-primary-600" aria-hidden="true" />
        </div>
        <div className="mt-4">{body()}</div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={checkNow}
            loading={checking}
            data-testid="device-check-now"
            className="flex items-center justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('devices.waiting.checkNow')}
          </Button>
          <Button
            variant="outline"
            onClick={logout}
            data-testid="device-logout"
            className="flex items-center justify-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('devices.waiting.signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DevicePending;
