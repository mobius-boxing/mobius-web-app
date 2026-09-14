import { act, renderHook } from '@testing-library/react';
import type { Column } from '../../components/ui/Table';
import { useColumnPreferences } from '../../hooks/useColumnPreferences';
import { columnPrefsKey } from '../../utils/columnPrefs';

let mockUser: { uuid: string } | null = { uuid: 'user-a' };
jest.mock('../../contexts/AuthContext', () => ({
  useAuthUser: () => mockUser,
}));

const col = (key: string, extra: Partial<Column> = {}): Column => ({ key, header: key, ...extra });
const code = () => [col('name', { hideable: false }), col('email'), col('role'), col('actions', { pinned: true })];
const visible = (result: { current: { columns: Column[] } }) => result.current.columns.map((c) => c.key);

const stored = (user: string, listId: string) => {
  const raw = window.localStorage.getItem(columnPrefsKey(user, listId));
  return raw ? JSON.parse(raw) : null;
};

describe('useColumnPreferences', () => {
  beforeEach(() => {
    mockUser = { uuid: 'user-a' };
    window.localStorage.clear();
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('passes columns through untouched without a listId', () => {
    const { result } = renderHook(() => useColumnPreferences(undefined, code()));
    expect(result.current.enabled).toBe(false);
    act(() => result.current.setVisible('email', false));
    expect(visible(result)).toEqual(['name', 'email', 'role', 'actions']);
    expect(window.localStorage.length).toBe(0);
  });

  it('hides, moves, persists and resets', () => {
    const { result, unmount } = renderHook(() => useColumnPreferences('users', code()));
    act(() => result.current.setVisible('email', false));
    act(() => result.current.move('role', -1));
    act(() => result.current.move('role', -1));
    expect(visible(result)).toEqual(['role', 'name', 'actions']);
    expect(stored('user-a', 'users')).toMatchObject({ v: 1, order: ['role', 'name', 'email', 'actions'], hidden: ['email'] });
    expect(result.current.isCustomized).toBe(true);
    unmount();

    const again = renderHook(() => useColumnPreferences('users', code())).result;
    expect(visible(again)).toEqual(['role', 'name', 'actions']);
    act(() => again.current.reset());
    expect(visible(again)).toEqual(['name', 'email', 'role', 'actions']);
    expect(stored('user-a', 'users')).toBeNull();
    expect(again.current.isCustomized).toBe(false);
  });

  it('applies two changes made in the same tick', () => {
    const { result } = renderHook(() => useColumnPreferences('users', code()));
    act(() => {
      result.current.setVisible('email', false);
      result.current.setVisible('role', false);
    });
    expect(visible(result)).toEqual(['name', 'actions']);
  });

  it('refuses to hide a non-hideable or pinned column, or move a pinned one', () => {
    const { result } = renderHook(() => useColumnPreferences('users', code()));
    act(() => result.current.setVisible('name', false));
    act(() => result.current.setVisible('actions', false));
    act(() => result.current.move('actions', -1));
    act(() => result.current.move('role', 1));
    expect(visible(result)).toEqual(['name', 'email', 'role', 'actions']);
  });

  it('skips pinned neighbours when moving', () => {
    const columns = [col('select', { pinned: true }), col('a'), col('b')];
    const { result } = renderHook(() => useColumnPreferences('parts', columns));
    act(() => result.current.move('b', -1));
    act(() => result.current.move('b', -1));
    expect(visible(result)).toEqual(['select', 'b', 'a']);
  });

  describe('moveTo (drag and drop)', () => {
    it('drops a column onto a later one, landing in its place, and persists', () => {
      const { result } = renderHook(() => useColumnPreferences('users', code()));
      act(() => result.current.moveTo('name', 'role'));
      expect(visible(result)).toEqual(['email', 'role', 'name', 'actions']);
      expect(stored('user-a', 'users').order).toEqual(['email', 'role', 'name', 'actions']);
    });

    it('drops a column onto an earlier one', () => {
      const { result } = renderHook(() => useColumnPreferences('users', code()));
      act(() => result.current.moveTo('role', 'name'));
      expect(visible(result)).toEqual(['role', 'name', 'email', 'actions']);
    });

    it('never drags or drops onto a pinned column, and pinned columns keep their index', () => {
      const columns = [col('select', { pinned: true }), col('a'), col('b'), col('c'), col('actions', { pinned: true })];
      const { result } = renderHook(() => useColumnPreferences('parts', columns));
      act(() => result.current.moveTo('actions', 'a'));
      act(() => result.current.moveTo('a', 'select'));
      act(() => result.current.moveTo('b', 'actions'));
      expect(visible(result)).toEqual(['select', 'a', 'b', 'c', 'actions']);
      expect(window.localStorage.length).toBe(0);
      act(() => result.current.moveTo('c', 'a'));
      expect(visible(result)).toEqual(['select', 'c', 'a', 'b', 'actions']);
    });

    it('stores the order the screen shows when a pinned column sits between source and target', () => {
      const columns = [col('a'), col('mid', { pinned: true }), col('b')];
      const { result } = renderHook(() => useColumnPreferences('x', columns));
      act(() => result.current.moveTo('b', 'a'));
      expect(visible(result)).toEqual(['b', 'mid', 'a']);
      expect(stored('user-a', 'x').order).toEqual(['b', 'mid', 'a']);
    });

    it('keeps hidden columns in the order and ignores unknown keys', () => {
      const { result } = renderHook(() => useColumnPreferences('users', code()));
      act(() => result.current.setVisible('email', false));
      act(() => result.current.moveTo('role', 'name'));
      act(() => result.current.moveTo('ghost', 'name'));
      expect(stored('user-a', 'users').order).toEqual(['role', 'name', 'email', 'actions']);
      expect(visible(result)).toEqual(['role', 'name', 'actions']);
    });
  });

  it('never hides the last visible column', () => {
    const columns = [col('a'), col('b')];
    const { result } = renderHook(() => useColumnPreferences('x', columns));
    act(() => result.current.setVisible('a', false));
    act(() => result.current.setVisible('b', false));
    expect(visible(result)).toEqual(['b']);
  });

  it('never shows or overwrites another user\'s layout when the user changes', () => {
    window.localStorage.setItem(columnPrefsKey('user-b', 'users'), JSON.stringify({ v: 1, order: ['email', 'name', 'role', 'actions'], hidden: [] }));
    const { result, rerender } = renderHook(() => useColumnPreferences('users', code()));
    act(() => result.current.setVisible('role', false));
    expect(visible(result)).toEqual(['name', 'email', 'actions']);

    mockUser = { uuid: 'user-b' };
    rerender();
    expect(visible(result)).toEqual(['email', 'name', 'role', 'actions']);
    expect(stored('user-a', 'users').hidden).toEqual(['role']);
    expect(stored('user-b', 'users').hidden).toEqual([]);
  });

  it('switches scope when the listId prop changes without a remount', () => {
    window.localStorage.setItem(columnPrefsKey('user-a', 'parts'), JSON.stringify({ v: 1, order: ['name', 'email', 'role', 'actions'], hidden: ['email'] }));
    const { result, rerender } = renderHook(({ id }) => useColumnPreferences(id, code()), { initialProps: { id: 'parts' } });
    expect(visible(result)).toEqual(['name', 'role', 'actions']);
    rerender({ id: 'parts-in-product' });
    expect(visible(result)).toEqual(['name', 'email', 'role', 'actions']);
    act(() => result.current.setVisible('role', false));
    expect(stored('user-a', 'parts').hidden).toEqual(['email']);
    expect(stored('user-a', 'parts-in-product').hidden).toEqual(['role']);
  });

  it('keeps working in memory when storage refuses writes', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    const { result } = renderHook(() => useColumnPreferences('users', code()));
    expect(result.current.isPersisted).toBe(true);
    act(() => result.current.setVisible('email', false));
    expect(visible(result)).toEqual(['name', 'role', 'actions']);
    expect(result.current.isPersisted).toBe(false);
    expect(result.current.isCustomized).toBe(true);
  });

  it('is session-only with no signed-in user', () => {
    mockUser = null;
    const { result } = renderHook(() => useColumnPreferences('users', code()));
    act(() => result.current.setVisible('email', false));
    expect(visible(result)).toEqual(['name', 'role', 'actions']);
    expect(result.current.isPersisted).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });

  it('uses the current render\'s column objects, never cached ones', () => {
    const { result, rerender } = renderHook(({ label }) =>
      useColumnPreferences('users', [col('name', { render: () => label }), col('email')]),
      { initialProps: { label: 'first' } }
    );
    act(() => result.current.setVisible('email', false));
    rerender({ label: 'second' });
    expect(result.current.columns[0].render!(null, {})).toBe('second');
  });

  it('disables persistence for duplicate keys', () => {
    const { result } = renderHook(() => useColumnPreferences('dup', [col('a'), col('a')]));
    expect(result.current.enabled).toBe(false);
    act(() => result.current.setVisible('a', false));
    expect(window.localStorage.length).toBe(0);
  });
});
