import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, RefreshCw, LogOut, Send } from 'lucide-react';
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
  const { user, device, deviceBlocked, refreshDevice, requestDevice, logout } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Same call for both cases it covers: a null device (the automatic mount call
  // below, and its manual retry) and a revoked one (the revoked -> pending
  // re-request, case 1 of the registration procedure — no re-login needed for
  // either). Hoisted above the mount effect so `requesting` — and the button's
  // `loading`/`disabled` state below — covers the automatic call too: without
  // this, a click while that first call is still in flight fired a second,
  // header-less POST and minted a second pending row.
  const requestApproval = useCallback(async () => {
    setRequesting(true);
    try {
      await requestDevice();
    } catch {
      // Stays on this screen; the button remains available to try again.
    } finally {
      setRequesting(false);
    }
  }, [requestDevice]);

  // `device === null` means this browser has no row yet — a member whose
  // mobius_session outlived a deploy, who will never log in again on their own
  // (gate amendment 3, D-230). Registers it once per mount; a failed attempt
  // leaves the ref set, so only the button below retries after that.
  const requestedRef = useRef(false);
  const needsRequest = deviceBlocked && user?.role === 'member' && device === null;

  useEffect(() => {
    if (!needsRequest || requestedRef.current) return;
    requestedRef.current = true;
    requestApproval();
  }, [needsRequest, requestApproval]);

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

    // `device: null` for a member means the API has no row for this browser yet;
    // `needsRequest` above is already registering one, so the copy here reads the
    // same as the normal wait rather than telling the member to do anything.
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

  const showRequestButton = !device || device.status === 'revoked';

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-secondary-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <ShieldCheck className="h-6 w-6 text-primary-600" aria-hidden="true" />
        </div>
        <div className="mt-4">{body()}</div>

        <div className="mt-8 flex flex-col gap-3">
          {showRequestButton && (
            <Button
              onClick={requestApproval}
              loading={requesting}
              data-testid="device-request-approval"
              className="flex items-center justify-center"
            >
              <Send className="mr-2 h-4 w-4" />
              {t('devices.waiting.requestApproval')}
            </Button>
          )}
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
