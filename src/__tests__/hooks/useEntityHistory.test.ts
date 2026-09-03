import { renderHook, act, waitFor } from '@testing-library/react';
import api from '../../services/api';
import {
  auditNotFound,
  getHistory,
  isAuditNotFound,
} from '../../services/audit';
import { useEntityHistory } from '../../hooks/useEntityHistory';

/**
 * Only the transport is mocked: the real `services/audit` sits between this
 * hook and axios, because two of the four things worth pinning here — the
 * `totalCount` → `total` adaptation and the 404-is-not-an-error rule — live in
 * that service and would be mocked away by stubbing `getHistory` itself.
 */
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = (api as unknown as { get: jest.Mock }).get;

/** The API's paginator: `count` is this page's rows, `totalCount` is the set. */
const paginator = (overrides: Record<string, unknown> = {}) => ({
  data: {
    success: true,
    data: [],
    page: 1,
    limit: 20,
    count: 0,
    totalCount: 0,
    totalPages: 0,
    ...overrides,
  },
});

const httpError = (status: number, message?: string) => ({
  response: { status, data: message ? { message } : undefined },
  message: `Request failed with status code ${status}`,
});

/** The last request's `params`, which is where page and limit travel. */
const paramsOf = (call: number): { page?: number; limit?: number } =>
  mockGet.mock.calls[call][1].params;

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue(paginator());
});

describe('useEntityHistory — the enabled guard', () => {
  /**
   * The one that protects the 20 page suites which mock `services/api`
   * wholesale: under those mocks this module's axios instance is undefined, so
   * a closed drawer that fetched at mount would take them all red the day a
   * list page grows a history column.
   */
  it('issues no request while enabled is false', async () => {
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useEntityHistory({
          entityKey: 'warehouses',
          uuid: '11111111-1111-4111-8111-111111111111',
          enabled: props.enabled,
        }),
      { initialProps: { enabled: false } }
    );

    // Give any effect that wanted to fire the chance to.
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.entries).toEqual([]);
    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBeNull();

    // And the assertion above is not vacuous: the same hook, enabled, fetches.
    rerender({ enabled: true });
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  });

  it('stays idle until it has a uuid', async () => {
    const { rerender } = renderHook(
      (props: { uuid: string | null }) =>
        useEntityHistory({ entityKey: 'warehouses', uuid: props.uuid }),
      { initialProps: { uuid: null as string | null } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGet).not.toHaveBeenCalled();

    rerender({ uuid: '11111111-1111-4111-8111-111111111111' });
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  });
});

describe('useEntityHistory — the paginator adaptation', () => {
  /**
   * The API answers `{count, totalCount, …}` and the SPA's `PaginatedResponse`
   * carries `total`. Reading `count` instead would look right on a first page
   * of 20 rows and silently break pagination until a second page existed —
   * weeks, on a fresh ledger. Asserted on the service, which is where the
   * mapping is.
   */
  it('maps totalCount to total, not the page row count', async () => {
    mockGet.mockResolvedValue(
      paginator({ data: [], count: 20, totalCount: 7, totalPages: 4 })
    );

    const result = await getHistory(
      'warehouses',
      '11111111-1111-4111-8111-111111111111'
    );

    expect(result.total).toBe(7);
    expect(result.totalPages).toBe(4);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('surfaces totalPages and the entries on the hook', async () => {
    const entry = { transactionRef: '42', rows: [], truncated: false };
    mockGet.mockResolvedValue(
      paginator({ data: [entry], count: 1, totalCount: 7, totalPages: 4 })
    );

    const { result } = renderHook(() =>
      useEntityHistory({
        entityKey: 'warehouses',
        uuid: '11111111-1111-4111-8111-111111111111',
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalPages).toBe(4);
    expect(result.current.entries).toHaveLength(1);
  });
});

describe('useEntityHistory — notFound is not an error', () => {
  /**
   * The API answers 404 both for "no history yet" and for "not your company's
   * record", so existence cannot be probed. The drawer renders a different tree
   * for each, and conflating them is how a permissions problem gets read as
   * data loss.
   */
  it('turns a 404 into notFound and leaves error null', async () => {
    mockGet.mockRejectedValue(httpError(404, 'No audit history found.'));

    const { result } = renderHook(() =>
      useEntityHistory({
        entityKey: 'warehouses',
        uuid: '11111111-1111-4111-8111-111111111111',
      })
    );

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.entries).toEqual([]);
  });

  it('turns a 500 into an error and leaves notFound false', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGet.mockRejectedValue(httpError(500, 'Boom'));

    const { result } = renderHook(() =>
      useEntityHistory({
        entityKey: 'warehouses',
        uuid: '11111111-1111-4111-8111-111111111111',
      })
    );

    await waitFor(() => expect(result.current.error).toBe('Boom'));
    expect(result.current.notFound).toBe(false);

    consoleError.mockRestore();
  });

  /** T2's panel test may reject with either shape; both must read as a 404. */
  it('recognises both the tagged rejection and a bare axios 404', () => {
    expect(isAuditNotFound(auditNotFound('nothing here'))).toBe(true);
    expect(isAuditNotFound(httpError(404))).toBe(true);
    expect(isAuditNotFound(httpError(500))).toBe(false);
    expect(isAuditNotFound(new Error('boom'))).toBe(false);
  });
});

describe('useEntityHistory — the page belongs to one record', () => {
  it('restarts at page 1 when pointed at another record', async () => {
    const uuidA = '11111111-1111-4111-8111-111111111111';
    const uuidB = '22222222-2222-4222-8222-222222222222';

    const { result, rerender } = renderHook(
      (props: { uuid: string }) =>
        useEntityHistory({ entityKey: 'warehouses', uuid: props.uuid }),
      { initialProps: { uuid: uuidA } }
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(paramsOf(0).page).toBe(1);

    act(() => result.current.setPage(3));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(paramsOf(1).page).toBe(3);
    expect(result.current.page).toBe(3);

    rerender({ uuid: uuidB });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(3));
    expect(result.current.page).toBe(1);
    // The new record is never asked for page 3 — not even once, in passing.
    expect(paramsOf(2).page).toBe(1);
    expect(mockGet.mock.calls[2][0]).toContain(uuidB);
    expect(mockGet).toHaveBeenCalledTimes(3);
  });
});
