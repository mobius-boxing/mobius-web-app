import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import { createMockAuthUser } from '../../test-utils/api.mock';
import AuditLogs from '../../pages/AuditLogs';
import { AuditRowView } from '../../types/audit';
import es from '../../i18n/locales/es/common.json';

/**
 * The Auditoría page's four load-bearing promises: it shows what the API
 * returned, it says out loud when the API narrowed the window, it offers the
 * CSV only to whoever may export, and every filter control actually reaches
 * the request.
 *
 * Assertions run against the SHIPPED Spanish copy (`t` resolves keys out of
 * `es/common.json` rather than a table pasted here), so a wording change
 * either keeps these honest or fails them on purpose.
 *
 * Mutation-checked (L-018): removing the 90-day notice turns the window cases
 * red, and rendering "Exportar CSV" unconditionally turns the permission case
 * red. Neither passes for a reason other than the rule it names.
 */

const mockListAuditLogs = jest.fn();
const mockListAuditEntities = jest.fn();
const mockExportAuditCsv = jest.fn();

jest.mock('../../services/audit', () => ({
  listAuditLogs: (...args: unknown[]) => mockListAuditLogs(...args),
  listAuditEntities: (...args: unknown[]) => mockListAuditEntities(...args),
  exportAuditCsv: (...args: unknown[]) => mockExportAuditCsv(...args),
}));

// Only CompanyContext reaches for it; the page's own client is mocked above.
jest.mock('../../services/api', () => ({
  companiesApi: { getCompanies: jest.fn() },
}));

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

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

// ── Fixtures ───────────────────────────────────────────────────────────────

const modification: AuditRowView = {
  uuid: 'row-1',
  occurredAt: '2026-09-23T14:05:00.000Z',
  entityName: 'warehouses',
  entityUuid: 'wh-1',
  entityCode: 'DEP-01',
  entityDescription: 'Depósito Central',
  operation: 'Modificacion',
  action: null,
  source: 'api',
  transactionRef: '900001',
  requestId: 'req-1',
  rootEntity: null,
  rootUuid: null,
  actor: {
    // The seeded superadmin, because the generic short name is what made the
    // first width measurement wrong: every cell here sizes to its content, so
    // a fixture shorter than real data proves nothing about the layout.
    username: 'superadmin@mobius.local',
    role: 'admin',
    isSupport: false,
    attributed: true,
  },
  changedKeys: ['name'],
  diff: [
    { key: 'name', label: 'name', before: 'Central', after: 'Central Norte' },
  ],
};

const unattributed: AuditRowView = {
  ...modification,
  uuid: 'row-2',
  occurredAt: '2026-09-01T09:00:00.000Z',
  entityName: 'files',
  entityCode: 'F-2201',
  entityDescription: 'plano.pdf',
  operation: 'Alta',
  source: 'sql',
  transactionRef: '900002',
  actor: { username: null, role: null, isSupport: false, attributed: false },
  changedKeys: ['fileName'],
  diff: [{ key: 'fileName', label: 'fileName', before: null, after: 'plano.pdf' }],
};

/**
 * A child row. `entityCode` is the stage NUMBER — `1` says nothing on its own,
 * which is exactly why the cell has to name what it belongs to.
 */
const routeStage: AuditRowView = {
  ...modification,
  uuid: 'row-3',
  occurredAt: '2026-08-30T18:30:00.000Z',
  entityName: 'production_route_stages',
  entityCode: '1',
  entityDescription: null,
  operation: 'Modificacion',
  transactionRef: '900003',
  rootEntity: 'production_routes',
  rootUuid: 'route-9',
  changedKeys: ['machineId'],
  diff: [{ key: 'machineId', label: 'machineId', before: null, after: null, resolved: false }],
};

/** The API's echo of the window it applied: 90 days back, nothing asked for. */
const NINETY_DAY_WINDOW = '2026-06-25T15:00:00.000Z';

const listResponse = (
  rows: AuditRowView[] = [modification, unattributed, routeStage]
) => ({
  data: rows,
  total: rows.length,
  page: 1,
  limit: 20,
  totalPages: 1,
  appliedFrom: NINETY_DAY_WINDOW,
  appliedTo: null,
});

const readOnlyUser = createMockAuthUser({
  role: 'member',
  permissions: ['audit.read'],
});

const exporterUser = createMockAuthUser({
  role: 'member',
  permissions: ['audit.read', 'audit.export'],
});

describe('AuditLogs page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListAuditLogs.mockResolvedValue(listResponse());
    mockListAuditEntities.mockResolvedValue([
      { key: 'warehouses', database: 'erp', labelKey: 'audit.entities.warehouses' },
      { key: 'customers', database: 'erp', labelKey: 'audit.entities.customers' },
    ]);
    mockExportAuditCsv.mockResolvedValue({
      fileName: 'auditoria-2026-06-05_2026-09-03.csv',
      rows: 42,
      truncated: false,
    });
  });

  describe('Rendering', () => {
    it('renders one row per ledger entry returned by the service', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      expect(await screen.findByText('DEP-01')).toBeInTheDocument();
      expect(screen.getByText('F-2201')).toBeInTheDocument();
      // The entity label, not the raw table name — and the raw name is still
      // one hover away, which is what `title` is doing here.
      expect(screen.getByTitle('warehouses')).toHaveTextContent('Depósito');
      expect(screen.getByTitle('files')).toHaveTextContent('Archivo');
    });

    it('names an unattributed actor Sistema rather than leaving the cell blank', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      const actors = await screen.findAllByTestId('audit-actor');
      expect(actors).toHaveLength(3);
      actors.forEach((node) => expect(node.textContent).not.toBe(''));

      expect(actors[0]).toHaveTextContent('superadmin@mobius.local');
      // The unattributed row says `Sistema`, and carries its `sql` source —
      // which is the whole explanation for why the ledger has no name to give.
      // Exact, not a whitespace-tolerant regex: the `·` separator must be
      // real text. Spaced only by a CSS margin it reads `Sistema· Base de
      // datos` to copy-paste, to a screen reader and to `textContent`.
      expect(actors[1].textContent).toBe('Sistema · Base de datos');
    });

    it('expands a row into the shared diff table', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      fireEvent.click(await screen.findByTestId('audit-expand-row-1'));

      const detail = await screen.findByTestId('audit-diff-row-1');
      expect(detail).toHaveTextContent('Central Norte');
      expect(screen.queryByTestId('audit-diff-row-2')).not.toBeInTheDocument();
    });

    it('renders timestamps as dd/MM/yyyy HH:mm, not in the browser default locale', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      // 2026-09-23T14:05Z. The 23rd cannot be a month, so `23/09/2026` proves
      // day-first order rather than merely agreeing with it; `toLocaleString()`
      // would render `9/23/2026, 8:05:00 AM` — American order in a Spanish UI.
      const cell = await screen.findByTestId('audit-expand-row-1');
      expect(cell).toHaveTextContent(/\b23\/09\/2026 \d{2}:\d{2}\b/);
      expect(cell).not.toHaveTextContent(/AM|PM/);
      expect(cell).not.toHaveTextContent('9/23/2026');

      // The exact instant — seconds included — stays one hover away.
      const stamp = cell.querySelector('time');
      expect(stamp?.getAttribute('title')).toMatch(/^23\/09\/2026 \d{2}:\d{2}:\d{2}$/);
    });

    it('names what a thin child row belongs to', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      // `1` is a stage number, not an identity. The cell has to say whose.
      const record = await screen.findByTestId('audit-record-row-3');
      expect(record).toHaveTextContent('1');
      expect(record).toHaveTextContent('Etapa de ruta · en Ruta de producción');

      // A row with no parent says only what it is.
      expect(screen.getByTestId('audit-record-row-1')).toHaveTextContent(
        'Depósito'
      );
      expect(screen.getByTestId('audit-record-row-1')).not.toHaveTextContent(
        '· en'
      );
    });

    it('clamps every content-sized cell, so a long value truncates instead of running off the table', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      // All five cells are `whitespace-nowrap` (Table.tsx), so a column with no
      // clamp sizes to its content and pushes the last column past the
      // wrapper — where it is cut by the container edge with no ellipsis,
      // because the truncation never happens. `Usuario` is the one that was
      // missed: `superadmin@mobius.local` is 23 characters and not exotic.
      const record = await screen.findByTestId('audit-record-row-1');
      const actor = screen.getAllByTestId('audit-actor')[0];
      const fields = screen.getByTestId('audit-fields-row-1');

      [record.firstElementChild, actor, fields].forEach((node) => {
        expect(node?.className).toMatch(/\btruncate\b/);
      });
      [record, actor, fields].forEach((node) => {
        expect(node?.className).toMatch(/\bmax-w-\[/);
      });

      // And the whole value stays reachable rather than being thrown away.
      expect(actor).toHaveTextContent('superadmin@mobius.local');
    });

    it('populates the entity filter from listAuditEntities', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      await waitFor(() => expect(mockListAuditEntities).toHaveBeenCalled());
      const select = screen.getByTestId('audit-filter-entity');
      await waitFor(() =>
        expect(select).toHaveTextContent(es.audit.entities.customers)
      );
      expect(select).toHaveTextContent(es.audit.entities.warehouses);
    });
  });

  describe('The applied 90-day window', () => {
    it('states the window above the table when the API narrowed the read', async () => {
      render(<AuditLogs />, { user: readOnlyUser });

      const notice = await screen.findByTestId('audit-window-notice');
      expect(notice).toHaveTextContent('Mostrando los últimos 90 días');
      expect(notice).toHaveTextContent('Ajustá el rango para ver más');
      // The boundary in the page's own day-first format — the 25th cannot be
      // a month — and with no seconds: this states a boundary, not an event.
      expect(notice).toHaveTextContent(/desde 25\/06\/2026 \d{2}:\d{2}\)/);
      expect(notice).not.toHaveTextContent(/\d{2}:\d{2}:\d{2}/);
      expect(notice).not.toHaveTextContent(/AM|PM/);
    });

    it('drops the notice once the reader sets a date bound of their own', async () => {
      render(<AuditLogs />, { user: readOnlyUser });
      await screen.findByTestId('audit-window-notice');

      fireEvent.change(screen.getByTestId('audit-filter-from'), {
        target: { value: '2026-01-01' },
      });

      await waitFor(() =>
        expect(mockListAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ from: '2026-01-01' })
        )
      );
      await waitFor(() =>
        expect(screen.queryByTestId('audit-window-notice')).not.toBeInTheDocument()
      );
    });
  });

  describe('Filters', () => {
    it('refetches with the filter the reader chose', async () => {
      render(<AuditLogs />, { user: readOnlyUser });
      await screen.findByText('DEP-01');

      fireEvent.change(screen.getByTestId('audit-filter-operation'), {
        target: { value: 'Alta' },
      });
      fireEvent.change(screen.getByTestId('audit-filter-entity'), {
        target: { value: 'warehouses' },
      });
      fireEvent.change(screen.getByTestId('audit-filter-username'), {
        target: { value: 'mnovoa' },
      });
      fireEvent.change(screen.getByTestId('audit-filter-changed-key'), {
        target: { value: 'name' },
      });

      await waitFor(() =>
        expect(mockListAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'Alta',
            entityName: 'warehouses',
            username: 'mnovoa',
            changedKey: 'name',
            page: 1,
            includeDiff: true,
          })
        )
      );
    });

    it('sends the end of the chosen day as `to`, not its midnight', async () => {
      render(<AuditLogs />, { user: readOnlyUser });
      await screen.findByText('DEP-01');

      fireEvent.change(screen.getByTestId('audit-filter-to'), {
        target: { value: '2026-09-03' },
      });

      await waitFor(() =>
        expect(mockListAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ to: '2026-09-03T23:59:59.999' })
        )
      );
    });
  });

  describe('CSV export', () => {
    it('offers no export to a reader without audit.export', async () => {
      render(<AuditLogs />, { user: readOnlyUser });
      await screen.findByText('DEP-01');

      expect(screen.queryByTestId('audit-export')).not.toBeInTheDocument();
      expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
    });

    it('offers it to a reader who holds audit.export', async () => {
      render(<AuditLogs />, { user: exporterUser });

      expect(await screen.findByTestId('audit-export')).toHaveTextContent(
        'Exportar CSV'
      );
    });

    it('downloads through the service, carrying the active filters', async () => {
      render(<AuditLogs />, { user: exporterUser });
      await screen.findByText('DEP-01');

      fireEvent.change(screen.getByTestId('audit-filter-source'), {
        target: { value: 'sql' },
      });
      await waitFor(() =>
        expect(mockListAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ source: 'sql' })
        )
      );

      fireEvent.click(screen.getByTestId('audit-export'));

      await waitFor(() =>
        expect(mockExportAuditCsv).toHaveBeenCalledWith({ source: 'sql' })
      );
      expect(await screen.findByTestId('audit-export-done')).toHaveTextContent(
        'auditoria-2026-06-05_2026-09-03.csv'
      );
    });

    it('warns, with the row count, when the server capped the file', async () => {
      mockExportAuditCsv.mockResolvedValue({
        fileName: 'auditoria.csv',
        rows: 10000,
        truncated: true,
      });

      render(<AuditLogs />, { user: exporterUser });
      fireEvent.click(await screen.findByTestId('audit-export'));

      const warning = await screen.findByTestId('audit-export-truncated');
      expect(warning).toHaveTextContent('10000');
      expect(warning).toHaveTextContent('alcanzó su límite');
    });
  });

  it('never builds the download itself — the module contains no fetch or <a download>', () => {
    // The bearer token lives in the `mobius_session` cookie and is attached by
    // the shared axios instance. A hand-built link would 401 in production and
    // pass every unit test, so the guard is on the source.
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../../pages/AuditLogs.tsx'),
      'utf8'
    );
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).not.toMatch(/<a\s[^>]*download/);
  });
});
