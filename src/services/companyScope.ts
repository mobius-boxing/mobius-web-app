/**
 * API route folders served from the central database (mobius-api
 * `tenant-context.middleware.ts`, ROUTE_PLANE). Every other folder is
 * company-scoped: each company's data lives in its own database, so the API
 * answers 400 COMPANY_REQUIRED to a superAdmin request that names no company.
 */
export const CENTRAL_API_FOLDERS: readonly string[] = [
  'auth',
  'companies',
  'db-servers',
  'health',
  'invitations',
  'modules',
  'public',
  'users',
];

const API_FOLDER = /^\/?api\/([^/?#]+)/;

/**
 * Adds the company switcher's selection to a company-scoped request that does
 * not already name a company. The API ignores `companyId` for everyone but
 * superAdmins, and only the superAdmin switcher stores a selection.
 */
export function withSelectedCompany<T extends { url?: string; params?: any }>(
  config: T,
  selectedCompanyUuid: string | null
): T {
  if (!selectedCompanyUuid) return config;
  const url = config.url ?? '';
  const folder = API_FOLDER.exec(url)?.[1];
  if (!folder || CENTRAL_API_FOLDERS.includes(folder)) return config;
  const named = config.params?.companyId;
  if (url.includes('companyId=') || (named !== undefined && named !== null && named !== '')) {
    return config;
  }
  config.params = { ...(config.params ?? {}), companyId: selectedCompanyUuid };
  return config;
}
