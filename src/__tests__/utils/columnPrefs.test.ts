import type { Column } from '../../components/ui/Table';
import {
  clearColumnPrefs,
  columnPrefsKey,
  mergeColumns,
  readColumnPrefs,
  writeColumnPrefs,
} from '../../utils/columnPrefs';

const col = (key: string, extra: Partial<Column> = {}): Column => ({ key, header: key, ...extra });
const keys = (columns: Column[]) => columns.map((c) => c.key);
const visibleKeys = (result: ReturnType<typeof mergeColumns>) =>
  result.ordered.filter((c) => !result.hidden.has(c.key)).map((c) => c.key);

const USER = '6f0a1e2c-8d3b-4c1e-9a7f-2b5d3e4f5a6b';

describe('mergeColumns', () => {
  it('returns code order and defaultHidden when there is no preference', () => {
    const code = [col('a', { hideable: false }), col('b', { defaultHidden: true }), col('c')];
    const result = mergeColumns(code, null);
    expect(keys(result.ordered)).toEqual(['a', 'b', 'c']);
    expect(Array.from(result.hidden)).toEqual(['b']);
  });

  it('never hides a pinned or non-hideable column even if defaultHidden', () => {
    const code = [col('select', { pinned: true, defaultHidden: true }), col('name', { hideable: false, defaultHidden: true }), col('x')];
    expect(mergeColumns(code, null).hidden.size).toBe(0);
  });

  it('applies the model worked example: gated and removed keys drop, new key lands next to its code neighbour, pinned stay put', () => {
    const code = [
      col('number', { hideable: false }), col('createdAt'), col('deliveryDate'), col('customer'), col('plant'),
      col('purchaseOrder'), col('quantity'), col('voided'), col('history'), col('actions', { pinned: true }),
    ];
    const pref = {
      order: ['actions', 'customer', 'number', 'deliveryDate', 'price', 'quantity', 'legacyRef', 'createdAt', 'purchaseOrder', 'voided', 'history'],
      hidden: ['purchaseOrder', 'legacyRef', 'price', 'voided'],
    };
    const result = mergeColumns(code, pref);
    expect(keys(result.ordered)).toEqual([
      'customer', 'plant', 'number', 'deliveryDate', 'quantity', 'createdAt', 'purchaseOrder', 'voided', 'history', 'actions',
    ]);
    expect(Array.from(result.hidden).sort()).toEqual(['purchaseOrder', 'voided']);
    expect(keys(result.ordered)).not.toContain('price');
    expect(keys(result.ordered)).not.toContain('legacyRef');
  });

  it('keeps a pinned column at its code index whatever the saved order says', () => {
    const code = [col('select', { pinned: true }), col('a'), col('b'), col('actions', { pinned: true })];
    const result = mergeColumns(code, { order: ['actions', 'b', 'select', 'a'], hidden: ['select', 'actions'] });
    expect(keys(result.ordered)).toEqual(['select', 'b', 'a', 'actions']);
    expect(result.hidden.size).toBe(0);
  });

  it('shows a column added after the save even when it is defaultHidden', () => {
    const code = [col('a'), col('b'), col('newOne', { defaultHidden: true })];
    const result = mergeColumns(code, { order: ['b', 'a'], hidden: [] });
    expect(keys(result.ordered)).toEqual(['b', 'newOne', 'a']);
    expect(result.hidden.has('newOne')).toBe(false);
  });

  it('inserts a new first column at the start and keeps consecutive new columns in code order', () => {
    const code = [col('n1'), col('n2'), col('a'), col('b')];
    const result = mergeColumns(code, { order: ['b', 'a'], hidden: [] });
    expect(keys(result.ordered)).toEqual(['n1', 'n2', 'b', 'a']);
  });

  it('keeps hiding a key the preference already hid', () => {
    const code = [col('a'), col('b', { defaultHidden: true })];
    expect(visibleKeys(mergeColumns(code, { order: ['a', 'b'], hidden: [] }))).toEqual(['a', 'b']);
    expect(visibleKeys(mergeColumns(code, { order: ['a', 'b'], hidden: ['b'] }))).toEqual(['a']);
  });

  it('keeps at least one column visible', () => {
    expect(visibleKeys(mergeColumns([col('a', { defaultHidden: true }), col('b', { defaultHidden: true })], null))).toEqual(['a']);
    expect(visibleKeys(mergeColumns([col('a'), col('b')], { order: ['b', 'a'], hidden: ['a', 'b'] }))).toEqual(['b']);
    expect(mergeColumns([], null).ordered).toEqual([]);
  });

  it('ignores the preference when column keys are duplicated', () => {
    const code = [col('a'), col('a'), col('b')];
    expect(keys(mergeColumns(code, { order: ['b', 'a'], hidden: ['b'] }).ordered)).toEqual(['a', 'a', 'b']);
  });

  it('returns the column objects of the current render', () => {
    const first = col('a');
    const second = col('a');
    expect(mergeColumns([second], { order: ['a'], hidden: [] }).ordered[0]).toBe(second);
    expect(mergeColumns([second], { order: ['a'], hidden: [] }).ordered[0]).not.toBe(first);
  });
});

describe('column preference storage', () => {
  const key = columnPrefsKey(USER, 'sales-orders');

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('uses the user- and list-scoped key', () => {
    expect(key).toBe(`column_prefs:${USER}:sales-orders`);
  });

  it('round-trips a preference', () => {
    expect(writeColumnPrefs(USER, 'sales-orders', { order: ['a', 'b'], hidden: ['b'] })).toBe(true);
    const result = readColumnPrefs(USER, 'sales-orders');
    expect(result.status).toBe('loaded');
    expect(result.status === 'loaded' && result.pref).toMatchObject({ v: 1, order: ['a', 'b'], hidden: ['b'] });
    expect(readColumnPrefs('other-user', 'sales-orders').status).toBe('absent');
  });

  it.each([['not json'], ['[]'], [JSON.stringify({ v: 1, order: 'a', hidden: [] })], [JSON.stringify({ order: [], hidden: [] })]])(
    'removes a malformed payload %s',
    (raw) => {
      window.localStorage.setItem(key, raw);
      expect(readColumnPrefs(USER, 'sales-orders').status).toBe('absent');
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  );

  it('preserves a payload written by a newer version', () => {
    const raw = JSON.stringify({ v: 2, layout: {} });
    window.localStorage.setItem(key, raw);
    expect(readColumnPrefs(USER, 'sales-orders').status).toBe('unsupported');
    expect(window.localStorage.getItem(key)).toBe(raw);
  });

  it('reports unavailable storage without throwing', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(readColumnPrefs(USER, 'sales-orders')).toEqual({ status: 'unavailable' });
    expect(writeColumnPrefs(USER, 'sales-orders', { order: [], hidden: [] })).toBe(false);
    expect(clearColumnPrefs(USER, 'sales-orders')).toBe(false);
  });
});
