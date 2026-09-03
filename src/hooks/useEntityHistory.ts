import { useCallback, useEffect, useState } from 'react';
import {
  AUDIT_DEFAULT_LIMIT,
  getHistory,
  isAuditNotFound,
} from '../services/audit';
import { HistoryEntry } from '../types/audit';
import { logger } from '../utils/logger';

/**
 * One record's audit history, paginated over transactions.
 *
 * Two things make this different from `useEntityList`:
 *
 * 1. **It fetches only while `enabled` is true.** A closed drawer must issue no
 *    request — both because a request nobody asked for is wrong, and because 20
 *    page suites `jest.mock` `services/api` wholesale, so anything that fetched
 *    at mount would turn them red the day a list page grows a history column.
 * 2. **A 404 is not an error.** The API answers 404 both for "no history yet"
 *    and for "not your company's record", deliberately, so existence does not
 *    leak. It arrives here as `notFound`, and `error` stays null: conflating the
 *    two is how a permissions problem gets read as data loss.
 */

export interface UseEntityHistoryOptions {
  /** The snake_case table name (`sales_orders`), never a label. */
  entityKey: string;
  /** The record's uuid. While absent, the hook stays idle. */
  uuid?: string | null;
  /** False keeps the hook idle — no request is issued. Defaults to true. */
  enabled?: boolean;
  /** Transactions per page; clamped to the API's ceiling of 100. */
  limit?: number;
}

export interface UseEntityHistoryReturn {
  entries: HistoryEntry[];
  loading: boolean;
  /** A real failure only. A 404 is `notFound`, not an error. */
  error: string | null;
  /** The record has no history, or it is not this company's. */
  notFound: boolean;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  refresh: () => Promise<void>;
}

const messageOf = (error: unknown): string => {
  const fallback = 'Failed to fetch history';
  if (!error || typeof error !== 'object') return fallback;
  const axiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export function useEntityHistory(
  options: UseEntityHistoryOptions
): UseEntityHistoryReturn {
  const {
    entityKey,
    uuid,
    enabled = true,
    limit = AUDIT_DEFAULT_LIMIT,
  } = options;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // The page belongs to one record: pointing the hook at another record starts
  // it at page 1 without a render in between, so no request is ever made for
  // page 3 of a record that was just swapped in.
  const target = `${entityKey}::${uuid ?? ''}`;
  const [pageState, setPageState] = useState({ target, page: 1 });
  const page = pageState.target === target ? pageState.page : 1;

  const setPage = useCallback(
    (next: number) => {
      setPageState({ target, page: next });
    },
    [target]
  );

  const active = enabled && Boolean(entityKey) && Boolean(uuid);

  const fetchPage = useCallback(async () => {
    if (!active) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await getHistory(entityKey, uuid as string, page, limit);
      setEntries(response.data || []);
      setTotalPages(response.totalPages || 0);
    } catch (err: unknown) {
      setEntries([]);
      setTotalPages(0);

      if (isAuditNotFound(err)) {
        setNotFound(true);
      } else {
        logger.error('History fetch error:', err);
        setError(messageOf(err));
      }
    } finally {
      setLoading(false);
    }
  }, [active, entityKey, uuid, page, limit]);

  const refresh = useCallback(() => fetchPage(), [fetchPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    entries,
    loading,
    error,
    notFound,
    page,
    setPage,
    totalPages,
    refresh,
  };
}

export default useEntityHistory;
