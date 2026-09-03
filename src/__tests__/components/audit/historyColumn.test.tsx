import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '../../../test-utils/renderWithProviders';
import Table from '../../../components/ui/Table';
import { historyColumn } from '../../../components/audit/historyColumn';
import es from '../../../i18n/locales/es/common.json';

/**
 * The column a page adds in one line — and the guard that makes adding it safe.
 *
 * The load-bearing case here is the third one: 20 page suites `jest.mock` the
 * whole of `services/api` with a factory whose default export is `undefined`,
 * so a history column that fetched at render would turn them red and the
 * failure would read as "the history column broke the pages". The assertion is
 * therefore on the call COUNT of `getHistory`, not on the absence of a
 * spinner: only a count can tell "did not fetch" from "fetched and rendered
 * nothing yet".
 *
 * Mutation-checked (L-018): mounting the drawer with `enabled: true` while
 * closed turns the zero-request case red.
 */

const mockGetHistory = jest.fn();

jest.mock('../../../services/audit', () => ({
  AUDIT_DEFAULT_LIMIT: 20,
  AUDIT_MAX_LIMIT: 100,
  getHistory: (...args: unknown[]) => mockGetHistory(...args),
  isAuditNotFound: (error: any) =>
    Boolean(error?.notFound) || error?.response?.status === 404,
}));

jest.mock('../../../contexts/AuthContext', () =>
  require('../../../test-utils/renderWithProviders').authContextMock()
);

const lookup = (key: string): string | undefined =>
  key
    .split('.')
    .reduce<any>((node, part) => (node == null ? undefined : node[part]), es);

const translate = (key: string, options?: Record<string, unknown>): string => {
  const raw = lookup(key) ?? (options?.defaultValue as string) ?? key;
  if (typeof raw !== 'string') return key;
  return raw.replace(/{{(\w+)}}/g, (match, name) =>
    options && options[name] !== undefined ? String(options[name]) : match
  );
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => translate(key, options),
  }),
}));

const row = { uuid: 'warehouse-uuid-1', name: 'Depósito Central' };

const nameColumn = {
  key: 'name',
  header: 'Nombre',
  render: (_value: any, warehouse: typeof row) => <span>{warehouse.name}</span>,
};

/** A page's inline array, exactly as the three pilot pages now spell it. */
const columns = [nameColumn, historyColumn('warehouses', translate)];

const emptyHistory = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

describe('historyColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHistory.mockResolvedValue(emptyHistory);
  });

  it('matches the Column contract Table consumes', () => {
    const column = historyColumn('warehouses', translate);

    expect(column.key).toBe('history');
    expect(column.header).toBe(es.audit.title);
    expect(typeof column.className).toBe('string');
    expect(typeof column.render).toBe('function');
    // One expression, one array element: the page keeps no state (AC-7).
    expect(Object.keys(column).sort()).toEqual([
      'className',
      'header',
      'key',
      'render',
    ]);
  });

  it('renders a button carrying the row uuid and an accessible name', () => {
    render(<Table data={[row]} columns={columns} />);

    const button = screen.getByTestId(`history-${row.uuid}`);
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAccessibleName(es.audit.title);
    // The rest of the row is untouched by the new column.
    expect(screen.getByText('Depósito Central')).toBeInTheDocument();
  });

  it('issues no request while the drawer is closed', async () => {
    render(<Table data={[row]} columns={columns} />);

    expect(screen.getByTestId(`history-${row.uuid}`)).toBeInTheDocument();

    // The call count first, and on its own: it is the assertion that fails if
    // the drawer ever fetches at mount, whatever the DOM happens to look like.
    await waitFor(() => {
      expect(screen.getByTestId(`history-${row.uuid}`)).toBeInTheDocument();
    });
    expect(mockGetHistory).toHaveBeenCalledTimes(0);

    expect(screen.queryByTestId('history-drawer')).not.toBeInTheDocument();
  });

  it('opens the drawer, and only then fetches', async () => {
    render(<Table data={[row]} columns={columns} />);

    fireEvent.click(screen.getByTestId(`history-${row.uuid}`));

    expect(await screen.findByTestId('history-drawer')).toBeInTheDocument();
    expect(await screen.findByText(es.audit.empty.title)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledTimes(1);
    });
    expect(mockGetHistory).toHaveBeenCalledWith(
      'warehouses',
      row.uuid,
      1,
      expect.any(Number)
    );
  });
});
