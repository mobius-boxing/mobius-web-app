import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser, DeviceSession, DeviceStatus, LoginCredentials, LoginResponse } from '../types';
import { authApi, setDeviceRejectionHandler } from '../services/api';
import { logger } from '../utils/logger';
import { getToken, setToken, clearToken, setDeviceToken } from '../utils/session';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  device: DeviceSession | null;
  deviceBlocked: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  refreshDevice: () => Promise<void>;
  requestDevice: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** AC-4-5's cadence: fast enough that approval feels immediate, slow enough that a
 *  waiting screen left open all morning does not eat the shared apiRateLimiter budget. */
const DEVICE_POLL_INTERVAL_MS = 10000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Unlike useAuth, never throws: shared UI such as Table renders outside an AuthProvider in tests. */
export const useAuthUser = (): AuthUser | null => useContext(AuthContext)?.user ?? null;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [device, setDevice] = useState<DeviceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const adoptSession = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    setDevice(currentUser.device ?? null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (getToken()) {
          await adoptSession();
        }
      } catch (error) {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [adoptSession]);

  // The session lives in a cookie shared across subdomains, so login/logout can happen in
  // another tab or app (e.g. the backoffice). Re-sync local React state when this tab regains
  // focus: adopt a session started elsewhere, or drop ours if it was ended elsewhere.
  useEffect(() => {
    const sync = () => {
      const hasToken = !!getToken();
      if (hasToken && !user) {
        adoptSession().catch(() => {});
      } else if (!hasToken && user) {
        setUser(null);
        setDevice(null);
      }
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [user, adoptSession]);

  // A member is blocked until this browser is approved. An admin/superAdmin has no
  // device row at all (device stays null), so the flag can never catch them.
  const deviceBlocked = user?.role === 'member' && device?.status !== 'approved';

  const refreshDevice = useCallback(async () => {
    setDevice(await authApi.getDevice());
  }, []);

  const requestDevice = useCallback(async () => {
    const response = await authApi.requestDevice();
    // Same rule as login: the raw secret goes to the cookie and nowhere else.
    if (response?.token) {
      setDeviceToken(response.token);
    }
    setDevice(response ? { ...response, token: undefined } : null);
  }, []);

  useEffect(() => {
    setDeviceRejectionHandler((status: DeviceStatus) => {
      // A 403 carries the status and nothing else; the rest of the row keeps coming
      // from the poll, which stays the single source for what the member sees.
      setDevice((previous) => (previous ? { ...previous, status } : previous));
    });
    return () => setDeviceRejectionHandler(null);
  }, []);

  useEffect(() => {
    // `device === null` is the unresolved case (no row for this browser yet): the
    // waiting screen's mount effect registers one via `requestDevice` (gate
    // amendment 3) before there is anything to poll; polling before that would
    // just read `data: null` back forever.
    if (!deviceBlocked || device === null) return;

    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      refreshDevice().catch(() => {});
    };

    const interval = window.setInterval(poll, DEVICE_POLL_INTERVAL_MS);
    // Coming back to the tab polls at once, so a device approved while the tab was
    // hidden does not cost the member another full interval.
    document.addEventListener('visibilitychange', poll);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [deviceBlocked, device, refreshDevice]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response: LoginResponse = await authApi.login(credentials);
    setToken(response.token);
    // The raw secret is returned exactly once, by the login that issued it. It goes to
    // the cookie and nowhere else: React state keeps the device without it, so the
    // secret cannot be read back out of a component tree or a devtools snapshot.
    if (response.device?.token) {
      setDeviceToken(response.device.token);
    }
    setUser(response.user);
    setDevice(response.device ? { ...response.device, token: undefined } : null);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      clearToken();
      localStorage.removeItem('selected_company_uuid');
      setUser(null);
      setDevice(null);
    }
  };

  const updateUser = (updatedUser: AuthUser): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    device,
    deviceBlocked,
    login,
    logout,
    updateUser,
    refreshDevice,
    requestDevice,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
