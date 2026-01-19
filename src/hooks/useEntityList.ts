import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaginatedResponse } from '../types';

/**
 * Parameters for fetching data
 */
export interface FetchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Options for configuring the useEntityList hook
 */
export interface UseEntityListOptions<T> {
  /** Function to fetch data from API */
  fetchFn: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  /** Initial number of items per page (default: 20) */
  initialLimit?: number;
  /** Whether to fetch data automatically on mount (default: true) */
  autoFetch?: boolean;
  /** Additional filters to include in every fetch */
  defaultFilters?: Record<string, unknown>;
  /** Fields to search in client-side filtering */
  searchFields?: (keyof T)[];
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Return type of the useEntityList hook
 */
export interface UseEntityListReturn<T> {
  /** Current data items */
  data: T[];
  /** Filtered data (client-side search applied if searchFields provided) */
  filteredData: T[];
  /** Whether data is being loaded */
  loading: boolean;
  /** Error message from last fetch attempt */
  error: string | null;
  /** Current pagination state */
  pagination: PaginationState;
  /** Current search term */
  search: string;
  /** Current sort field */
  sortBy: string | null;
  /** Current sort order */
  sortOrder: 'asc' | 'desc';
  /** Current additional filters */
  filters: Record<string, unknown>;

  // Actions
  /** Fetch data with optional custom parameters */
  fetch: (params?: FetchParams) => Promise<void>;
  /** Refresh data using current parameters */
  refresh: () => Promise<void>;
  /** Set current page */
  setPage: (page: number) => void;
  /** Set items per page */
  setLimit: (limit: number) => void;
  /** Set search term */
  setSearch: (search: string) => void;
  /** Set sort field and order */
  setSort: (sortBy: string | null, sortOrder?: 'asc' | 'desc') => void;
  /** Set additional filters */
  setFilters: (filters: Record<string, unknown>) => void;
  /** Clear all filters and search */
  clearFilters: () => void;
}

/**
 * Custom hook for managing entity list state
 *
 * Extracts the repeated pattern from list pages:
 * - Data fetching with loading/error states
 * - Pagination state (page, limit, total, totalPages)
 * - Search state
 * - Sort state (sortBy, sortOrder)
 * - Filter state
 * - Client-side search filtering
 *
 * @example
 * ```tsx
 * const SuppliersPage = () => {
 *   const { t } = useTranslation();
 *
 *   const {
 *     filteredData: suppliers,
 *     loading,
 *     search,
 *     setSearch,
 *     refresh,
 *     pagination,
 *   } = useEntityList<Supplier>({
 *     fetchFn: suppliersApi.getSuppliers,
 *     searchFields: ['code'],
 *   });
 *
 *   return (
 *     <Layout>
 *       <SearchInput value={search} onChange={setSearch} />
 *       <Table data={suppliers} loading={loading} />
 *       <Pagination {...pagination} onPageChange={setPage} />
 *     </Layout>
 *   );
 * };
 * ```
 */
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

  // Data state
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter/sort state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, unknown>>(defaultFilters);

  /**
   * Fetch data from API
   */
  const fetch = useCallback(
    async (customParams?: FetchParams) => {
      setLoading(true);
      setError(null);

      try {
        // Build params, excluding undefined values
        const params: FetchParams = {
          page,
          limit,
          ...filters,
          ...defaultFilters,
          ...customParams,
        };

        // Only add optional params if they have values
        if (search) params.search = search;
        if (sortBy) params.sortBy = sortBy;
        if (sortBy) params.sortOrder = sortOrder;

        const response = await fetchFn(params);

        setData(response.data || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);

        // Update page from response if different (e.g., server corrected invalid page)
        if (response.page && response.page !== page) {
          setPage(response.page);
        }
      } catch (err: unknown) {
        console.error('Fetch error:', err);

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
    [fetchFn, page, limit, search, sortBy, sortOrder, filters, defaultFilters]
  );

  /**
   * Refresh data using current parameters
   */
  const refresh = useCallback(() => fetch(), [fetch]);

  /**
   * Set sort field and order
   */
  const setSort = useCallback(
    (newSortBy: string | null, newSortOrder: 'asc' | 'desc' = 'asc') => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    []
  );

  /**
   * Clear all filters and search
   */
  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  /**
   * Client-side filtered data
   * Only applies if searchFields are provided
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

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder, JSON.stringify(filters)]);

  return {
    data,
    filteredData,
    loading,
    error,
    pagination: { page, limit, total, totalPages },
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
