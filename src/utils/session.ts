// The access token lives in memory only: a page reload re-acquires it through the HttpOnly
// refresh cookie that the API sets (POST /api/auth/refresh), so script on the page never
// holds anything that outlives the tab. The device cookie below is the only cookie JS writes;
// it is scoped to the parent domain (REACT_APP_COOKIE_DOMAIN, e.g. ".mobiusboxing.com") so one
// approval covers every Mobius origin. On localhost the domain is omitted (host-only cookie,
// which browsers share across ports).

// Dev builds set REACT_APP_COOKIE_PREFIX=mobius_dev so they never read a prod session.
const COOKIE_PREFIX = process.env.REACT_APP_COOKIE_PREFIX || 'mobius';
const COOKIE_NAME = `${COOKIE_PREFIX}_session`;
const COOKIE_DOMAIN = process.env.REACT_APP_COOKIE_DOMAIN; // ".mobiusboxing.com" in prod; unset locally

export const DEVICE_COOKIE_NAME = `${COOKIE_PREFIX}_device`;
const DEVICE_MAX_AGE_SECONDS = 31536000; // 365 days

const buildCookie = (nameValue: string, maxAge: number): string => {
  const parts = [nameValue, 'path=/', `max-age=${maxAge}`, 'samesite=lax'];
  if (COOKIE_DOMAIN) parts.push(`domain=${COOKIE_DOMAIN}`);
  if (window.location.protocol === 'https:') parts.push('secure');
  return parts.join('; ');
};

let accessToken: string | null = null;

export const getToken = (): string | null => accessToken;

export const setToken = (token: string): void => {
  accessToken = token;
};

export const clearToken = (): void => {
  accessToken = null;
};

// Older builds kept the JWT in a JS-readable `${prefix}_session` cookie. Expire it with the
// attributes it was written with, or the browser keeps the old cookie beside a new one.
document.cookie = buildCookie(`${COOKIE_NAME}=`, 0);

// The device secret rides the same parent-domain cookie as the session (so one
// approval covers every Mobius origin) but has a life of its own: it identifies
// the BROWSER, not the session, and an approved browser must stay approved
// across logouts and across whoever logs in next. There is deliberately no
// clearDeviceToken — logging out clears mobius_session only.
export const getDeviceToken = (): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + DEVICE_COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setDeviceToken = (token: string): void => {
  document.cookie = buildCookie(`${DEVICE_COOKIE_NAME}=${encodeURIComponent(token)}`, DEVICE_MAX_AGE_SECONDS);
};

// The superAdmin company switcher's choice. It lives here rather than in
// CompanyContext so the API layer can drop it when the server reports the
// company is gone, without importing the context (which imports the API).
export const COMPANY_STORAGE_KEY = 'selected_company_uuid';

/** Returns true when a stored selection was actually removed. */
export const clearSelectedCompany = (): boolean => {
  try {
    if (localStorage.getItem(COMPANY_STORAGE_KEY) === null) return false;
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    return true;
  } catch {
    // Private mode / storage disabled: nothing was stored, nothing to clear.
    return false;
  }
};

/** The company switcher's stored choice; null when none is stored or storage is unavailable. */
export const getSelectedCompanyUuid = (): string | null => {
  try {
    return localStorage.getItem(COMPANY_STORAGE_KEY);
  } catch {
    return null;
  }
};
