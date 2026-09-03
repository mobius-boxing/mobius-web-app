import api from './api';
import { PaginatedResponse } from '../types';
import {
  AuditCsvExport,
  AuditEntity,
  AuditLogFilters,
  AuditLogListParams,
  AuditLogListResult,
  AuditRowView,
  HistoryEntry,
} from '../types/audit';

/**
 * The client for `/api/audit-logs` (the API's P3 read surface).
 *
 * It calls through the **shared axios instance** (`./api`'s default export), so
 * the bearer token — which lives in the cross-subdomain cookie `mobius_session`,
 * not in localStorage — the 401 handling and the base URL all come from the one
 * place that owns them. Nothing here reads a token, and nothing here uses
 * `fetch`: a hand-built request would send no `Authorization` header and 401.
 *
 * Two adaptations happen here and nowhere else:
 *  - the API's paginator is `{success, data, page, limit, count, totalCount,
 *    totalPages}` while the SPA's `PaginatedResponse` is `{data, total, page,
 *    limit, totalPages}`, so `totalCount` is mapped to `total` exactly as
 *    `warehousesApi.getWarehouses` does;
 *  - a 404 from the history endpoint is **not an error**. The API answers 404
 *    both for "no history yet" and for "not your company's record", on purpose,
 *    so existence cannot be probed. It is surfaced as a typed rejection the
 *    caller can recognise with `isAuditNotFound`, never as an error message.
 *
 * This module must issue no request at import time: 20 page test suites mock
 * `services/api` wholesale, which leaves this file's `api` undefined under them.
 */

const AUDIT_BASE = '/api/audit-logs';

/** `HISTORY_MAX_LIMIT` in the API's DAO. Asking for more is silently clamped. */
export const AUDIT_MAX_LIMIT = 100;

/** The API's own default page size. */
export const AUDIT_DEFAULT_LIMIT = 20;

const CSV_FALLBACK_NAME = 'auditoria.csv';

const clampLimit = (limit?: number): number => {
  if (!limit || !Number.isFinite(limit)) return AUDIT_DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), AUDIT_MAX_LIMIT);
};

/**
 * A history 404, as a rejection the caller can tell apart from a real failure.
 *
 * Built with `Object.assign` rather than `class extends Error`: this app
 * compiles to ES5, where a subclass of a built-in breaks `instanceof`, and the
 * flag is what callers test anyway.
 */
export type AuditNotFound = Error & { notFound: true };

export const auditNotFound = (message: string): AuditNotFound =>
  Object.assign(new Error(message), { notFound: true as const });

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null)?.response?.status;

/**
 * True for our own typed rejection and for any raw axios 404 — so a caller is
 * right whether it was handed the service's error or an untouched one.
 */
export const isAuditNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  if ((error as { notFound?: unknown }).notFound === true) return true;
  return statusOf(error) === 404;
};

/** Drops unset and empty filters so `?username=` never reaches the API. */
const toFilters = (params: AuditLogFilters): Record<string, string> => {
  const query: Record<string, string> = {};
  (Object.keys(params) as (keyof AuditLogFilters)[]).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') return;
    query[key] = String(value);
  });
  return query;
};

const toListQuery = (
  params: AuditLogListParams
): Record<string, string | number> => {
  const { page, limit, includeDiff, ...filters } = params;
  const query: Record<string, string | number> = {
    ...toFilters(filters),
    page: page && page > 0 ? Math.trunc(page) : 1,
    limit: clampLimit(limit),
  };
  if (includeDiff) query.include = 'diff';
  return query;
};

const headerOf = (
  headers: unknown,
  name: string
): string | undefined => {
  const value = (headers as Record<string, unknown> | null | undefined)?.[name];
  return typeof value === 'string' ? value : undefined;
};

/**
 * The server names the export after the window it applied
 * (`auditoria-2026-06-04_2026-09-02.csv`), sent RFC 5987-encoded. `filename*`
 * first, then a plain `filename`, then a fallback — an unnamed download is
 * still better than a failed one.
 */
const fileNameFrom = (disposition?: string): string => {
  if (!disposition) return CSV_FALLBACK_NAME;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      return CSV_FALLBACK_NAME;
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : CSV_FALLBACK_NAME;
};

/** The save half of `filesApi.downloadFile`, on a blob we already hold. */
const saveBlob = (data: BlobPart, fileName: string): void => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * `GET /audit-logs/history/:entityName/:entityUuid` — one record's history,
 * paginated over transactions rather than rows.
 *
 * @param entityKey the snake_case table name (`sales_orders`), never a label.
 * @throws an `AuditNotFound` rejection on 404 (empty history OR another
 *         tenant's record — the API refuses to distinguish them).
 */
export const getHistory = async (
  entityKey: string,
  uuid: string,
  page = 1,
  limit = AUDIT_DEFAULT_LIMIT
): Promise<PaginatedResponse<HistoryEntry>> => {
  try {
    const response = await api.get(
      `${AUDIT_BASE}/history/${encodeURIComponent(entityKey)}/${encodeURIComponent(uuid)}`,
      { params: { page, limit: clampLimit(limit) } }
    );
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  } catch (error: unknown) {
    if (statusOf(error) === 404) {
      throw auditNotFound('No audit history found for this record.');
    }
    throw error;
  }
};

/** `GET /audit-logs` — the ledger browser, with the applied window echoed. */
export const listAuditLogs = async (
  params: AuditLogListParams = {}
): Promise<AuditLogListResult> => {
  const response = await api.get(AUDIT_BASE, { params: toListQuery(params) });
  const backendData = response.data;
  return {
    data: backendData.data,
    total: backendData.totalCount,
    page: backendData.page,
    limit: backendData.limit,
    totalPages: backendData.totalPages,
    appliedFrom: backendData.appliedFrom ?? null,
    appliedTo: backendData.appliedTo ?? null,
  };
};

/** `GET /audit-logs/:uuid` — one row with its diff and both snapshots. */
export const getAuditLog = async (uuid: string): Promise<AuditRowView> => {
  const response = await api.get(`${AUDIT_BASE}/${uuid}`);
  return response.data.data;
};

/** `GET /audit-logs/entities` — the 74 audited tables, for the filter menu. */
export const listAuditEntities = async (): Promise<AuditEntity[]> => {
  const response = await api.get(`${AUDIT_BASE}/entities`);
  return response.data.data ?? [];
};

/**
 * `GET /audit-logs/export.csv` — the same filtered set as the list, saved to
 * disk through axios so the `Authorization` header travels with the request.
 *
 * No `page`/`limit`: the endpoint ignores them (an export is the whole filtered
 * set under a 10 000-row cap), and sending a param that provably cannot change
 * the response is exactly what L-007 forbids.
 */
export const exportAuditCsv = async (
  params: AuditLogFilters = {}
): Promise<AuditCsvExport> => {
  const response = await api.get(`${AUDIT_BASE}/export.csv`, {
    params: toFilters(params),
    responseType: 'blob',
  });

  const fileName = fileNameFrom(
    headerOf(response.headers, 'content-disposition')
  );
  const reported = Number.parseInt(
    headerOf(response.headers, 'x-export-rows') ?? '',
    10
  );

  saveBlob(response.data, fileName);

  return {
    fileName,
    rows: Number.isNaN(reported) ? null : reported,
    truncated: headerOf(response.headers, 'x-export-truncated') === '1',
  };
};
