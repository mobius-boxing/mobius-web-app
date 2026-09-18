import { act, renderHook, waitFor } from '@testing-library/react';
import { useEntityList } from '../../hooks/useEntityList';
import { FilterDef } from '../../components/ui/filters/types';
import { PaginatedResponse } from '../../types';

interface Row {
  id: string;
}

const page = (data: Row[] = [{ id: 'row-1' }]): PaginatedResponse<Row> => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

describe('useEntityList — enabled', () => {
  it('makes no request on mount or refresh while disabled, and fetches once when enabled flips true', async () => {
    const fetchFn = jest.fn().mockResolvedValue(page());
    const { result, rerender } = renderHook(
      ({ enabled }) => useEntityList<Row>({ fetchFn, enabled }),
      { initialProps: { enabled: false } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
    expect(result.current.pagination.total).toBe(0);

    await act(async () => {
      await result.current.refresh();
    });
    expect(fetchFn).not.toHaveBeenCalled();

    await act(async () => {
      rerender({ enabled: true });
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'row-1' }]));
  });
});

describe('useEntityList — filterDefs', () => {
  const requiredDef: FilterDef[] = [
    { kind: 'entity', key: 'customerUuid', label: 'Customer', required: true, loadOptions: async () => [] },
  ];

  it('does not fetch until the required filter has a value, then fetches with it resolved to its value', async () => {
    const fetchFn = jest.fn().mockResolvedValue(page());
    const { result } = renderHook(() =>
      useEntityList<Row>({ fetchFn, filterDefs: requiredDef })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.filtersReady).toBe(false);

    await act(async () => {
      result.current.setFilter('customerUuid', { value: 'cust-1', label: 'Acme' });
      await Promise.resolve();
    });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, customerUuid: 'cust-1' })
    );
    expect(result.current.filtersReady).toBe(true);
  });

  it('resets the search term once the required filter is cleared', async () => {
    const fetchFn = jest.fn().mockResolvedValue(page());
    const { result } = renderHook(() =>
      useEntityList<Row>({ fetchFn, filterDefs: requiredDef })
    );

    await act(async () => {
      result.current.setFilter('customerUuid', { value: 'cust-1', label: 'Acme' });
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setSearch('box');
    });
    expect(result.current.search).toBe('box');

    await act(async () => {
      result.current.setFilter('customerUuid', undefined);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.search).toBe(''));
  });

  it('drops a response that lands after the required filter was cleared', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchFn = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const { result } = renderHook(() =>
      useEntityList<Row>({ fetchFn, filterDefs: requiredDef })
    );

    act(() => {
      result.current.setFilter('customerUuid', { value: 'c-1', label: 'Acme' });
    });
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setFilter('customerUuid', undefined);
    });
    await act(async () => {
      resolveFetch({ data: [{ id: 'stale' }], total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.pagination.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('filterBarProps.onChange routes "search" to the debounced search and other keys to setFilter', async () => {
    const fetchFn = jest.fn().mockResolvedValue(page());
    const { result } = renderHook(() =>
      useEntityList<Row>({ fetchFn, filterDefs: requiredDef })
    );

    act(() => {
      result.current.filterBarProps.onChange('search', 'acme');
    });
    expect(result.current.search).toBe('acme');
    expect(result.current.filters.customerUuid).toBeUndefined();

    act(() => {
      result.current.filterBarProps.onChange('customerUuid', { value: 'cust-2', label: 'Beta' });
    });
    expect(result.current.filters.customerUuid).toEqual({ value: 'cust-2', label: 'Beta' });
    expect(result.current.filterBarProps.values.customerUuid).toEqual({ value: 'cust-2', label: 'Beta' });
    expect(result.current.filterBarProps.values.search).toBe('acme');
  });
});
