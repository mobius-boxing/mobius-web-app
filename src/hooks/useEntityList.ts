import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaginatedResponse } from '../types';
import { logger } from '../utils/logger';

export interface FetchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface UseEntityListOptions<T> {
  fetchFn: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  initialLimit?: number;
  autoFetch?: boolean;
  defaultFilters?: Record<string, unknown>;
  searchFields?: (keyof T)[];
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export interface UseEntityListReturn<T> {
  data: T[];
  filteredData: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  paginationProps: PaginationProps;
  search: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;

  fetch: (params?: FetchParams) => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: string | null, sortOrder?: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
}

export function useEntityList<T extends object>(
  options: UseEntityListOptions<T>
): UseEntityListReturn<T> {
  const {
    fetchFn,
    initialLimit = 20,
    autoFetch = true,
    defaultFilters = {},
    searchFields = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFiltersState] = useState<Record<string, unknown>>(defaultFilters);

  // Debounce search for server-side fetching (300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const setPage = useCallback((next: number) => {
    setPageState(next);
  }, []);

  const setLimit = useCallback((next: number) => {
    setLimitState(next);
    setPageState(1);
  }, []);

  const setSearch = useCallback((next: string) => {
    setSearchState(next);
    setPageState(1);
  }, []);

  const setSort = useCallback(
    (newSortBy: string | null, newSortOrder: 'asc' | 'desc' = 'asc') => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setPageState(1);
    },
    []
  );

  const setFilters = useCallback((next: Record<string, unknown>) => {
    setFiltersState(next);
    setPageState(1);
  }, []);

  const fetch = useCallback(
    async (customParams?: FetchParams) => {
      setLoading(true);
      setError(null);

      try {
        const params: FetchParams = {
          page,
          limit,
          ...filters,
          ...defaultFilters,
          ...customParams,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (sortBy) params.sortBy = sortBy;
        if (sortBy) params.sortOrder = sortOrder;

        const response = await fetchFn(params);

        setData(response.data || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);

        // Update page from response if different (e.g., server corrected invalid page)
        if (response.page && response.page !== page) {
          setPageState(response.page);
        }
      } catch (err: unknown) {
        logger.error('Fetch error:', err);

        let errorMessage = 'Failed to fetch data';
        if (err && typeof err === 'object') {
          const axiosError = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          errorMessage =
            axiosError.response?.data?.message ||
            axiosError.message ||
            errorMessage;
        }

        setError(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, page, limit, debouncedSearch, sortBy, sortOrder, filters, defaultFilters]
  );

  const refresh = useCallback(() => fetch(), [fetch]);

  const clearFilters = useCallback(() => {
    setSearchState('');
    setSortBy(null);
    setSortOrder('asc');
    setFiltersState(defaultFilters);
    setPageState(1);
  }, [defaultFilters]);

  /**
   * Client-side filtered data
   * Only applies if searchFields are provided.
   * Kept as a fallback to avoid a flash of stale unfiltered rows while the
   * server-side search request is in-flight. When the server returns
   * already-narrowed data this is a no-op.
   */
  const filteredData = useMemo(() => {
    if (!search.trim() || searchFields.length === 0) {
      return data;
    }

    const term = search.toLowerCase().trim();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = (item as Record<string, unknown>)[field as string];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, search, searchFields]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder, JSON.stringify(filters), debouncedSearch]);

  return {
    data,
    filteredData,
    loading,
    error,
    pagination: { page, limit, total, totalPages },
    paginationProps: {
      page,
      totalPages,
      total,
      limit,
      onPageChange: setPage,
      onLimitChange: setLimit,
    },
    search,
    sortBy,
    sortOrder,
    filters,
    fetch,
    refresh,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
  };
}

export default useEntityList;
