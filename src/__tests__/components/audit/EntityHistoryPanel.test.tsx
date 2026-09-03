import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders as render } from '../../../test-utils/renderWithProviders';
import EntityHistoryPanel from '../../../components/audit/EntityHistoryPanel';
import EntityHistoryDrawer from '../../../components/audit/EntityHistoryDrawer';
import historyColumn from '../../../components/audit/historyColumn';
import {
  AuditActor,
  AuditRowView,
  HistoryEntry,
} from '../../../types/audit';
import es from '../../../i18n/locales/es/common.json';

/**
 * The five honest-rendering rules of the drawer, plus the reading order that
 * makes the list scannable.
 *
 * Every assertion is against the SHIPPED Spanish copy: `t` below resolves keys
 * out of `es/common.json` rather than a table copied into this file, so a
 * string that changes in the locale file either keeps these tests honest or
 * fails them on purpose. Unmapped keys fall back to `defaultValue` and then to
 * the key, exactly as i18next does.
 *
 * Mutation-checked (L-018): breaking the `attributed` branch, the noise
 * filter, the redacted branch, the unresolved branch, or the 404 branch each
 * turns the matching case red.
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

/**
 * Per-test label stubs, consulted before the shipped copy and cleared between
 * tests.
 *
 * Almost everything here asserts the real Spanish strings on purpose. The one
 * exception is `audit.entities.*`: that block is a growing catalogue of table
 * labels, so a test that pinned one of its members goes red whenever somebody
 * translates an unrelated table — which is exactly what happened when
 * `production_route_stages` gained a label and the child sub-heading stopped
 * falling back to the raw table name. Stubbing the lookup keeps the assertion
 * on the panel's behaviour (a child row is titled by its OWN entity label)
 * rather than on today's copy.
 */
const labelStubs = new Map<string, string>();

const translate = (key: string, options?: Record<string, unknown>): string => {
  const raw =
    labelStubs.get(key) ??
    lookup(key) ??
    (options?.defaultValue as string) ??
    key;
  if (typeof raw !== 'string') return key;
  return raw.replace(/{{(\w+)}}/g, (match, name) =>
    options && options[name] !== undefined ? String(options[name]) : match
  );
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: any) => translate(key, options) }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────
// Six shapes, because six things can happen to a value: it changed, nobody is
// named, the record was born, the value is not stored, the reference cannot be
// named, and there was more than the ledger will hand back at once.

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();

const anActor = (over: Partial<AuditActor> = {}): AuditActor => ({
  username: 'mnovoa',
  role: 'admin',
  isSupport: false,
  attributed: true,
  ...over,
});

const aRow = (over: Partial<AuditRowView> = {}): AuditRowView => ({
  uuid: 'row-1',
  occurredAt: hoursAgo(3),
  entityName: 'warehouses',
  entityUuid: 'wh-1',
  entityCode: null,
  entityDescription: null,
  operation: 'Modificacion',
  action: null,
  source: 'api',
  transactionRef: 'tx-1',
  requestId: null,
  rootEntity: null,
  rootUuid: null,
  actor: anActor(),
  changedKeys: [],
  diff: [],
  ...over,
});

const anEntry = (over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  transactionRef: 'tx-1',
  occurredAt: hoursAgo(3),
  actor: anActor(),
  action: null,
  // Server-built Spanish naming Postgres tables. The SPA must not render it.
  summary: 'Modificación de warehouses (4 campos)',
  rows: [aRow()],
  truncated: false,
  ...over,
});

const modification = anEntry({
  transactionRef: 'tx-modification',
  occurredAt: hoursAgo(3),
  rows: [
    aRow({
      uuid: 'row-modification',
      transactionRef: 'tx-modification',
      changedKeys: ['name', 'grid_rows', 'grid_cols', 'company_id'],
      diff: [
        { key: 'name', label: 'name', before: 'Depósito Norte', after: 'Depósito Sur' },
        { key: 'grid_rows', label: 'grid_rows', before: 10, after: 12 },
        { key: 'grid_cols', label: 'grid_cols', before: 20, after: null },
        { key: 'company_id', label: 'company_id', before: 3, after: 4 },
      ],
    }),
  ],
});

const unattributed = anEntry({
  transactionRef: 'tx-unattributed',
  occurredAt: hoursAgo(5),
  actor: anActor({ username: null, role: null, attributed: false }),
  rows: [
    aRow({
      uuid: 'row-unattributed',
      transactionRef: 'tx-unattributed',
      source: 'sql',
      actor: anActor({ username: null, role: null, attributed: false }),
      changedKeys: ['name'],
      diff: [{ key: 'name', label: 'name', before: 'A', after: 'B' }],
    }),
  ],
});

const creation = anEntry({
  transactionRef: 'tx-creation',
  occurredAt: hoursAgo(30),
  rows: [
    aRow({
      uuid: 'row-creation',
      transactionRef: 'tx-creation',
      operation: 'Alta',
      changedKeys: ['id', 'uuid', 'name', 'grid_rows', 'createdAt', 'updatedAt', 'legacyId'],
      // The noise entries carry values on purpose: with both sides null the
      // uninformative-row filter would drop them whatever the noise list said,
      // and these tests would stop guarding the noise list at all.
      diff: [
        { key: 'id', label: 'id', before: null, after: 7 },
        { key: 'uuid', label: 'uuid', before: null, after: 'wh-1' },
        { key: 'name', label: 'name', before: null, after: 'Depósito Norte' },
        { key: 'grid_rows', label: 'grid_rows', before: null, after: 10 },
        { key: 'createdAt', label: 'createdAt', before: null, after: '2026-09-03T10:00:00Z' },
        { key: 'updatedAt', label: 'updatedAt', before: null, after: '2026-09-03T10:00:00Z' },
        { key: 'legacyId', label: 'legacyId', before: null, after: 412 },
      ],
    }),
  ],
});

const redacted = anEntry({
  transactionRef: 'tx-redacted',
  rows: [
    aRow({
      uuid: 'row-redacted',
      transactionRef: 'tx-redacted',
      entityName: 'users',
      changedKeys: ['password'],
      // `before`/`after` are ABSENT, not null: the values were never stored.
      diff: [{ key: 'password', label: 'password', before: undefined, after: undefined, redacted: true }],
    }),
  ],
});

const unresolved = anEntry({
  transactionRef: 'tx-unresolved',
  rows: [
    aRow({
      uuid: 'row-unresolved',
      transactionRef: 'tx-unresolved',
      entityName: 'customers',
      changedKeys: ['categoryId'],
      diff: [{ key: 'categoryId', label: 'categoryId', before: 41, after: 77, resolved: false }],
    }),
  ],
});

const truncated = anEntry({
  transactionRef: 'tx-truncated',
  truncated: true,
  rows: [
    aRow({
      uuid: 'row-route',
      transactionRef: 'tx-truncated',
      entityName: 'production_routes',
      changedKeys: ['name'],
      diff: [{ key: 'name', label: 'name', before: 'Ruta A', after: 'Ruta B' }],
    }),
    aRow({
      uuid: 'row-stage',
      transactionRef: 'tx-truncated',
      entityName: 'production_route_stages',
      operation: 'Alta',
      changedKeys: ['sequence'],
      diff: [{ key: 'sequence', label: 'sequence', before: null, after: 2 }],
    }),
  ],
});

/**
 * A route save: one field on the record and one on each of two child rows.
 * The headline has to speak for all three, or it promises 1 and delivers 3.
 */
const routeSave = anEntry({
  transactionRef: 'tx-route',
  rows: [
    aRow({
      uuid: 'row-route-parent',
      transactionRef: 'tx-route',
      entityName: 'production_routes',
      changedKeys: ['name'],
      diff: [{ key: 'name', label: 'name', before: 'Ruta A', after: 'Ruta B' }],
    }),
    aRow({
      uuid: 'row-stage-1',
      transactionRef: 'tx-route',
      entityName: 'production_route_stages',
      changedKeys: ['number'],
      diff: [{ key: 'number', label: 'number', before: 1, after: 2 }],
    }),
    aRow({
      uuid: 'row-stage-2',
      transactionRef: 'tx-route',
      entityName: 'production_route_stages',
      changedKeys: ['number'],
      diff: [{ key: 'number', label: 'number', before: 2, after: 3 }],
    }),
  ],
});

/**
 * A creation that dragged four auto-generated locations in with it — the shape
 * that made `Alta · Depósito · 28 campos` a true sentence nobody wanted.
 */
const creationWithChildren = anEntry({
  transactionRef: 'tx-with-children',
  rows: [
    aRow({
      uuid: 'row-parent',
      transactionRef: 'tx-with-children',
      operation: 'Alta',
      changedKeys: ['name'],
      diff: [{ key: 'name', label: 'name', before: null, after: 'Depósito Norte' }],
    }),
    ...[1, 2, 3, 4].map((n) =>
      aRow({
        uuid: `row-location-${n}`,
        transactionRef: 'tx-with-children',
        entityName: 'warehouse_locations',
        operation: 'Alta',
        changedKeys: ['location_code'],
        diff: [
          { key: 'location_code', label: 'location_code', before: null, after: `A-${n}` },
        ],
      })
    ),
  ],
});

/** A deletion that took exactly one child with it. */
const deletion = anEntry({
  transactionRef: 'tx-deletion',
  rows: [
    aRow({
      uuid: 'row-deleted',
      transactionRef: 'tx-deletion',
      operation: 'Baja',
      changedKeys: ['name'],
      diff: [{ key: 'name', label: 'name', before: 'Depósito Norte', after: null }],
    }),
    aRow({
      uuid: 'row-deleted-child',
      transactionRef: 'tx-deletion',
      entityName: 'warehouse_locations',
      operation: 'Baja',
      changedKeys: ['location_code'],
      diff: [{ key: 'location_code', label: 'location_code', before: 'A-1', after: null }],
    }),
  ],
});

/** A modification carrying the bookkeeping columns the API always sends. */
const noisyModification = anEntry({
  transactionRef: 'tx-noisy',
  rows: [
    aRow({
      uuid: 'row-noisy',
      transactionRef: 'tx-noisy',
      changedKeys: ['id', 'name', 'createdAt', 'grid_rows', 'updatedAt'],
      diff: [
        { key: 'id', label: 'id', before: 7, after: 7 },
        { key: 'name', label: 'name', before: 'Norte', after: 'Sur' },
        { key: 'createdAt', label: 'createdAt', before: '2026-01-04T09:00:00Z', after: '2026-01-04T09:00:00Z' },
        { key: 'grid_rows', label: 'grid_rows', before: 10, after: 12 },
        { key: 'updatedAt', label: 'updatedAt', before: '2026-01-04T09:00:00Z', after: '2026-09-03T10:00:00Z' },
      ],
    }),
  ],
});

/** A creation whose optional columns were simply never filled in. */
const sparseCreation = anEntry({
  transactionRef: 'tx-sparse',
  rows: [
    aRow({
      uuid: 'row-sparse',
      transactionRef: 'tx-sparse',
      operation: 'Alta',
      changedKeys: ['id', 'name', 'capacity', 'metadata'],
      diff: [
        { key: 'id', label: 'id', before: null, after: null },
        { key: 'name', label: 'name', before: null, after: 'Sector A' },
        { key: 'capacity', label: 'capacity', before: null, after: null },
        { key: 'metadata', label: 'metadata', before: '', after: '' },
      ],
    }),
  ],
});

const respondWith = (entries: HistoryEntry[], totalPages = 1) =>
  mockGetHistory.mockResolvedValue({
    data: entries,
    total: entries.length,
    page: 1,
    limit: 20,
    totalPages,
  });

const renderPanel = (props: Partial<React.ComponentProps<typeof EntityHistoryPanel>> = {}) =>
  render(<EntityHistoryPanel entityKey="warehouses" uuid="wh-1" {...props} />);

const expand = async (transactionRef: string): Promise<HTMLElement> => {
  const button = await screen.findByTestId(`history-entry-${transactionRef}`);
  fireEvent.click(button);
  return screen.getByTestId(`history-detail-${transactionRef}`);
};

describe('EntityHistoryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    labelStubs.clear();
    respondWith([modification]);
  });

  describe('AC-1 — the entry list', () => {
    it('renders one entry per transaction, newest first, with the Alta last', async () => {
      respondWith([modification, unattributed, creation]);
      renderPanel();

      await screen.findByTestId('history-entry-tx-modification');

      const headlines = screen
        .getAllByTestId(/^history-entry-/)
        .map((node) => node.textContent || '');

      expect(headlines).toHaveLength(3);
      expect(headlines[0]).toContain('Modificación');
      expect(headlines[2]).toContain('Alta');
    });

    it('composes the headline client-side and never renders the server summary', async () => {
      renderPanel();

      expect(
        await screen.findByText('Modificación · Depósito · 4 campos')
      ).toBeInTheDocument();
      expect(screen.queryByText(/warehouses/)).not.toBeInTheDocument();
    });

    it('shows the actor and a relative time carrying the absolute one', async () => {
      renderPanel();

      expect(await screen.findByText('por mnovoa')).toBeInTheDocument();

      const when = screen.getByText('hace 3 h');
      expect(when).toHaveAttribute('title');
      expect(when.getAttribute('title')).not.toEqual('');
    });

    it('previews three changed fields and counts the rest', async () => {
      renderPanel();

      const entry = await screen.findByTestId('history-entry-tx-modification');
      expect(entry).toHaveTextContent(
        'Nombre, Filas de la grilla, Columnas de la grilla +1'
      );
    });

    it('counts the whole transaction, children included', async () => {
      respondWith([routeSave]);
      renderPanel({ entityKey: 'production_routes' });

      // 1 field on the route + 1 on each of two stages. A headline reading
      // "1 campo" over a body of three rows is the headline nobody believes
      // again.
      expect(
        await screen.findByText('Modificación · Ruta de producción · 3 campos')
      ).toBeInTheDocument();
    });

    it('de-duplicates the preview names but counts the changes', async () => {
      respondWith([routeSave]);
      renderPanel({ entityKey: 'production_routes' });

      const entry = await screen.findByTestId('history-entry-tx-route');
      expect(entry).toHaveTextContent('Nombre, Número +1');
    });

    it('measures a creation in the records it brought, not in fields', async () => {
      respondWith([creationWithChildren]);
      renderPanel();

      // Every column of a new record is new, so a field count would describe
      // the width of the table rather than the size of the event.
      expect(
        await screen.findByText('Alta · Depósito · 4 registros relacionados')
      ).toBeInTheDocument();
      expect(screen.queryByText(/campos?$/)).not.toBeInTheDocument();
    });

    it('says nothing more about a creation that stands alone', async () => {
      respondWith([creation]);
      renderPanel();

      const entry = await screen.findByTestId('history-entry-tx-creation');
      expect(entry).toHaveTextContent('Alta · Depósito');
      expect(entry).not.toHaveTextContent('campo');
      // The preview named three arbitrary new columns; the values are what
      // matters on a creation, and they are one click away.
      expect(entry).not.toHaveTextContent('Filas de la grilla');
    });

    it('counts a single related record in the singular', async () => {
      respondWith([deletion]);
      renderPanel();

      expect(
        await screen.findByText('Baja · Depósito · 1 registro relacionado')
      ).toBeInTheDocument();
    });

    it('starts collapsed and expands the whole row', async () => {
      renderPanel();

      const entry = await screen.findByTestId('history-entry-tx-modification');
      expect(entry).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByTestId('history-detail-tx-modification')
      ).not.toBeInTheDocument();

      fireEvent.click(entry);
      expect(entry).toHaveAttribute('aria-expanded', 'true');
      expect(
        screen.getByTestId('history-detail-tx-modification')
      ).toBeInTheDocument();
    });

    it('issues no request while disabled', async () => {
      renderPanel({ enabled: false });
      await waitFor(() => expect(mockGetHistory).not.toHaveBeenCalled());
    });
  });

  describe('AC-2 — an unattributed change', () => {
    it('reads Sistema in the actor slot, never a blank', async () => {
      respondWith([unattributed]);
      renderPanel();

      const actor = await screen.findByTestId('history-actor');
      expect(actor).toHaveTextContent('Sistema');
      expect(actor.textContent).toBe('Sistema');
      expect(screen.queryByText(/^por/)).not.toBeInTheDocument();
    });

    it('explains why nobody is named', async () => {
      respondWith([unattributed]);
      renderPanel();

      const actor = await screen.findByTestId('history-actor');
      expect(actor).toHaveAttribute(
        'title',
        'Cambio sin usuario atribuido (carga de archivo o acceso público).'
      );
      expect(actor).toHaveAttribute('aria-label');
    });

    it('marks a support actor with a chip beside the name', async () => {
      respondWith([
        anEntry({
          transactionRef: 'tx-support',
          actor: anActor({ username: 'soporte', isSupport: true }),
        }),
      ]);
      renderPanel();

      expect(await screen.findByText('por soporte')).toBeInTheDocument();
      expect(screen.getByText('Soporte Mobius')).toBeInTheDocument();
    });
  });

  describe('AC-3 — 404 is not an error', () => {
    it('renders the both-meanings empty state, with no retry and no talk of deletion', async () => {
      mockGetHistory.mockRejectedValue(
        Object.assign(new Error('not found'), { notFound: true })
      );
      renderPanel();

      const empty = await screen.findByTestId('history-empty');
      expect(empty).toHaveTextContent('Sin historial');
      expect(empty).toHaveTextContent(
        'No hay cambios registrados para este registro, o el registro no pertenece a tu empresa.'
      );
      expect(empty.textContent).not.toMatch(/eliminad|borrad/i);

      expect(screen.queryByTestId('history-retry')).not.toBeInTheDocument();
      expect(screen.queryByTestId('history-error')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders an error and a retry for a non-404 failure', async () => {
      mockGetHistory.mockRejectedValue({
        response: { status: 500, data: { message: 'Error del servidor' } },
      });
      renderPanel();

      expect(await screen.findByTestId('history-error')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Error del servidor');
      expect(screen.getByTestId('history-retry')).toBeInTheDocument();
      expect(screen.queryByTestId('history-empty')).not.toBeInTheDocument();
    });

    it('refetches when the retry is used', async () => {
      mockGetHistory.mockRejectedValue({ response: { status: 500 } });
      renderPanel();

      const retry = await screen.findByTestId('history-retry');
      respondWith([modification]);
      fireEvent.click(retry);

      expect(await screen.findByTestId('history-entry-tx-modification')).toBeInTheDocument();
      expect(mockGetHistory).toHaveBeenCalledTimes(2);
    });

    it('shows the same empty state when the record simply has no entries', async () => {
      respondWith([]);
      renderPanel();

      expect(await screen.findByTestId('history-empty')).toBeInTheDocument();
    });
  });

  describe('AC-4 — Alta noise', () => {
    it('drops the bookkeeping columns from the table', async () => {
      respondWith([creation]);
      renderPanel();

      const detail = await expand('tx-creation');

      ['id', 'uuid', 'createdAt', 'updatedAt', 'legacyId'].forEach((key) => {
        expect(
          within(detail).queryByTestId(`history-field-${key}`)
        ).not.toBeInTheDocument();
      });
      expect(detail.textContent).not.toContain('createdAt');

      expect(within(detail).getByTestId('history-field-name')).toBeInTheDocument();
      expect(
        within(detail).getByTestId('history-field-grid_rows')
      ).toBeInTheDocument();
    });

    it('excludes them from the headline count', async () => {
      respondWith([noisyModification]);
      renderPanel();

      // Two of the five diff entries are bookkeeping. A count of 4 would mean
      // the table and the headline disagree about what a change is.
      expect(
        await screen.findByText('Modificación · Depósito · 2 campos')
      ).toBeInTheDocument();
    });

    it('drops the columns that are empty on both sides of a creation', async () => {
      respondWith([sparseCreation]);
      renderPanel();

      const detail = await expand('tx-sparse');

      // `capacity: <Vacío> → <Vacío>` is the same defect as showing
      // `createdAt`: a row that looks like data and carries none.
      expect(
        within(detail).queryByTestId('history-field-capacity')
      ).not.toBeInTheDocument();
      expect(
        within(detail).queryByTestId('history-field-metadata')
      ).not.toBeInTheDocument();
      // One header row and one field row: `name` stays, because "nothing to
      // Sector A" is a change a reader can act on.
      expect(within(detail).getAllByRole('row')).toHaveLength(2);
      expect(within(detail).getByTestId('history-field-name')).toBeInTheDocument();
      expect(await screen.findByText('Alta · Depósito')).toBeInTheDocument();
    });

    it('says the record was created when nothing but noise changed', async () => {
      respondWith([
        anEntry({
          transactionRef: 'tx-bare',
          rows: [
            aRow({
              uuid: 'row-bare',
              transactionRef: 'tx-bare',
              operation: 'Alta',
              changedKeys: ['id', 'uuid', 'createdAt'],
              diff: [
                { key: 'id', label: 'id', before: null, after: 9 },
                { key: 'uuid', label: 'uuid', before: null, after: 'wh-9' },
                {
                  key: 'createdAt',
                  label: 'createdAt',
                  before: null,
                  after: '2026-09-03T10:00:00Z',
                },
              ],
            }),
          ],
        }),
      ]);
      renderPanel();

      const detail = await expand('tx-bare');
      expect(detail).toHaveTextContent('Registro creado.');
      expect(within(detail).queryByRole('table')).not.toBeInTheDocument();
      expect(await screen.findByText('Alta · Depósito')).toBeInTheDocument();
    });
  });

  describe('AC-5 — a redacted value', () => {
    it('renders exactly one value cell reading modificado', async () => {
      respondWith([redacted]);
      renderPanel();

      const detail = await expand('tx-redacted');
      const row = within(detail).getByTestId('history-field-password');
      const cells = within(row).getAllByRole('cell');

      // "Exactly one cell", not "no value shown": `before` and `after` are both
      // absent here, so falling through to the value path would render two
      // perfectly innocent-looking `<Vacío>`s.
      expect(cells).toHaveLength(1);
      expect(cells[0]).toHaveAttribute('colspan', '2');
      expect(cells[0]).toHaveTextContent('modificado');
      expect(cells[0]).toHaveAttribute(
        'title',
        'El valor no se almacena en el registro de auditoría.'
      );
      expect(detail.textContent).not.toContain('<Vacío>');
    });
  });

  describe('AC-6 — an unresolved reference', () => {
    it('renders one cell reading cambió and never the raw id', async () => {
      respondWith([unresolved]);
      renderPanel();

      const detail = await expand('tx-unresolved');
      const row = within(detail).getByTestId('history-field-categoryId');
      const cells = within(row).getAllByRole('cell');

      expect(cells).toHaveLength(1);
      expect(cells[0]).toHaveAttribute('colspan', '2');
      expect(cells[0]).toHaveTextContent('cambió');
      expect(row.textContent).not.toMatch(/\d/);
      expect(detail.textContent).not.toContain('41');
      expect(detail.textContent).not.toContain('77');
    });
  });

  describe('the diff table itself', () => {
    it('is campo · antes · después, with the field label carrying the raw column', async () => {
      renderPanel();

      const detail = await expand('tx-modification');
      const headers = within(detail)
        .getAllByRole('columnheader')
        .map((node) => node.textContent);

      expect(headers).toEqual(['Campo', 'Antes', 'Después']);
      expect(within(detail).getByTestId('history-field-name')).toHaveTextContent(
        'Nombre'
      );
      expect(
        within(within(detail).getByTestId('history-field-name')).getByRole(
          'rowheader'
        )
      ).toHaveAttribute('title', 'name');
    });

    it('aligns the label and its values on the same top edge', async () => {
      renderPanel();

      const detail = await expand('tx-modification');
      const row = within(detail).getByTestId('history-field-name');

      // `vertical-align` is not inherited, so this has to sit on the cells
      // themselves; on the `<tbody>` it did nothing and the label floated.
      expect(within(row).getByRole('rowheader')).toHaveClass('align-top');
      within(row)
        .getAllByRole('cell')
        .forEach((cell) => expect(cell).toHaveClass('align-top'));
    });

    it('renders an absent value as <Vacío> rather than a blank cell', async () => {
      renderPanel();

      const detail = await expand('tx-modification');
      const row = within(detail).getByTestId('history-field-grid_cols');
      const cells = within(row).getAllByRole('cell');

      expect(cells).toHaveLength(2);
      expect(cells[0]).toHaveTextContent('20');
      expect(cells[1]).toHaveTextContent('<Vacío>');
      expect(cells[1]).toHaveAttribute('title', 'El campo no tiene valor.');
    });

    it('labels the child tables the pilot entities actually write', async () => {
      respondWith([routeSave]);
      renderPanel({ entityKey: 'production_routes' });

      const detail = await expand('tx-route');
      const stageRows = within(detail).getAllByTestId('history-field-number');

      // `number` and `location_code` are real columns of the two child tables
      // the browser run surfaced; without their blocks the scannable line read
      // `Nombre, description, setupTimeMinutes`.
      expect(stageRows).toHaveLength(2);
      stageRows.forEach((row) =>
        expect(within(row).getByRole('rowheader')).toHaveTextContent('Número')
      );
    });

    it('groups a child table under its own sub-heading and admits truncation', async () => {
      // Distinct sentinels: the sub-heading must carry the CHILD's label, so a
      // panel that titled the group after the parent (or after the entity the
      // drawer was opened on) fails here instead of reading plausibly.
      labelStubs.set('audit.entities.production_routes', 'ETIQUETA_PADRE');
      labelStubs.set('audit.entities.production_route_stages', 'ETIQUETA_HIJO');
      respondWith([truncated]);
      renderPanel();

      const detail = await expand('tx-truncated');

      expect(detail).toHaveTextContent('ETIQUETA_HIJO · Alta');
      expect(detail).not.toHaveTextContent('ETIQUETA_PADRE · Alta');
      expect(
        within(detail).getByTestId('history-field-sequence')
      ).toBeInTheDocument();
      expect(detail).toHaveTextContent(
        'Se muestran los primeros 200 cambios de esta transacción.'
      );
    });
  });

  describe('loading and pagination', () => {
    it('holds the layout with skeleton rows instead of a spinner', () => {
      mockGetHistory.mockImplementation(() => new Promise(() => {}));
      renderPanel();

      expect(screen.getByTestId('history-loading')).toBeInTheDocument();
      expect(screen.getAllByTestId('history-skeleton-row')).toHaveLength(3);
    });

    it('offers page controls only when there is more than one page', async () => {
      respondWith([modification]);
      renderPanel();
      await screen.findByTestId('history-entry-tx-modification');
      expect(screen.queryByTestId('history-next-page')).not.toBeInTheDocument();

      respondWith([modification], 3);
      renderPanel();
      expect(await screen.findByTestId('history-next-page')).toBeInTheDocument();
    });
  });
});

describe('EntityHistoryDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    labelStubs.clear();
    respondWith([modification]);
  });

  const renderDrawer = (onClose = jest.fn(), isOpen = true) => {
    const view = render(
      <EntityHistoryDrawer
        isOpen={isOpen}
        onClose={onClose}
        entityKey="warehouses"
        uuid="wh-1"
        recordLabel="Depósito Norte"
      />
    );
    return { ...view, onClose };
  };

  it('issues no request while closed', async () => {
    renderDrawer(jest.fn(), false);
    await waitFor(() => expect(mockGetHistory).not.toHaveBeenCalled());
    expect(screen.queryByTestId('history-drawer')).not.toBeInTheDocument();
  });

  it('renders outside the cell it was opened from', async () => {
    render(
      <table>
        <tbody>
          <tr>
            <td className="whitespace-nowrap" data-testid="cell">
              <EntityHistoryDrawer
                isOpen
                onClose={jest.fn()}
                entityKey="warehouses"
                uuid="wh-1"
              />
            </td>
          </tr>
        </tbody>
      </table>
    );

    await screen.findByTestId('history-entry-tx-modification');

    // `position: fixed` escapes layout, not the cascade: inside the cell the
    // sheet inherited `Table.tsx`'s `whitespace-nowrap` and every string in it
    // clipped, and `.gd-table tbody td` reached its diff cells.
    expect(screen.getByTestId('history-drawer')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('cell')).queryByTestId('history-drawer')
    ).not.toBeInTheDocument();
  });

  it('declares its own whitespace handling', () => {
    renderDrawer();

    // jsdom lays nothing out, so a clipped line is invisible to a test. The
    // honest guard at this level is that the sheet states the property rather
    // than trusting whatever it is mounted inside.
    expect(screen.getByTestId('history-drawer')).toHaveClass('whitespace-normal');
  });

  it('is a labelled modal dialog carrying the panel', async () => {
    renderDrawer();

    const drawer = screen.getByRole('dialog');
    const heading = screen.getByRole('heading', { name: 'Historial' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).toBeTruthy();
    expect(screen.getByText('Depósito Norte')).toBeInTheDocument();
    expect(
      await screen.findByTestId('history-entry-tx-modification')
    ).toBeInTheDocument();
  });

  it('moves focus to the close button and locks background scroll', async () => {
    renderDrawer();

    expect(screen.getByTestId('history-drawer-close')).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await screen.findByTestId('history-entry-tx-modification');
  });

  it('closes when the overlay is clicked', async () => {
    const onClose = jest.fn();
    const view = renderDrawer(onClose);
    await screen.findByTestId('history-entry-tx-modification');

    fireEvent.click(screen.getByTestId('history-drawer-overlay'));
    expect(onClose).toHaveBeenCalled();
    view.unmount();
  });

  it('closes from the close button', async () => {
    const onClose = jest.fn();
    const view = renderDrawer(onClose);
    await screen.findByTestId('history-entry-tx-modification');

    fireEvent.click(screen.getByTestId('history-drawer-close'));
    expect(onClose).toHaveBeenCalled();
    view.unmount();
  });

  it('takes Escape, in the capture phase so an overlay underneath keeps its own', async () => {
    const onClose = jest.fn();
    const view = renderDrawer(onClose);
    await screen.findByTestId('history-entry-tx-modification');
    const underneath = jest.fn();
    document.addEventListener('keydown', underneath);

    // Dispatched from inside the page, the way a real key press arrives: the
    // drawer's capture-phase listener runs before any document-level listener
    // a `Modal` underneath registered, and stops the event there.
    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
    expect(underneath).not.toHaveBeenCalled();
    document.removeEventListener('keydown', underneath);
    view.unmount();
  });

  it('restores the background scroll and the caller focus when it closes', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const view = renderDrawer();
    expect(document.body.style.overflow).toBe('hidden');
    await screen.findByTestId('history-entry-tx-modification');

    view.unmount();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

describe('historyColumn — naming the record in the drawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respondWith([modification]);
  });

  const openHistoryFor = (row: Record<string, unknown>) => {
    const column = historyColumn('warehouses', translate);
    render(<>{column.render(null, row)}</>);
    fireEvent.click(screen.getByTestId(`history-${row.uuid as string}`));
  };

  it('names the record by the identifier the row carries', async () => {
    openHistoryFor({ uuid: 'wh-1', name: 'Depósito Norte' });

    expect(await screen.findByTestId('history-drawer-record')).toHaveTextContent(
      'Depósito Norte'
    );
  });

  it('prefers the business code, which is how people refer to a record', async () => {
    openHistoryFor({ uuid: 'wh-2', code: 'DEP-01', name: 'Depósito Norte' });

    expect(await screen.findByTestId('history-drawer-record')).toHaveTextContent(
      'DEP-01'
    );
  });

  it('takes a numeric order number as an identifier', async () => {
    openHistoryFor({ uuid: 'so-1', number: 1042 });

    expect(await screen.findByTestId('history-drawer-record')).toHaveTextContent(
      '1042'
    );
  });

  it('shows the title alone rather than guess at a name', async () => {
    openHistoryFor({ uuid: 'wh-3' });

    const drawer = await screen.findByTestId('history-drawer');
    expect(within(drawer).getByRole('heading')).toHaveTextContent('Historial');
    expect(
      screen.queryByTestId('history-drawer-record')
    ).not.toBeInTheDocument();
  });
});
