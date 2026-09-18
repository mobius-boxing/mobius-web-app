import { columnFilters, columnFilterDefs, ColumnFilterSpec } from '../../filters/columnFilters';
import { Column } from '../../components/ui/Table';
import { Translate } from '../../validation/fields';

/** Mirrors `react-i18next`'s `t`, including the `defaultValue` fallback `columnFilterDefs` relies on. */
const t: Translate = (key: string, options?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'filters.boolean.yes': 'Sí',
    'filters.boolean.no': 'No',
    'filters.range.from': 'desde',
    'filters.range.to': 'hasta',
    'filters.options.pending': 'Pendiente',
    'filters.options.approved': 'Aprobado',
    'filters.options.cancelled': 'Cancelado',
    'filters.columns.createdAt': 'Creado',
  };
  if (key in translations) return translations[key];
  const defaultValue = options?.defaultValue;
  return typeof defaultValue === 'string' ? defaultValue : key;
};

/**
 * The Table column keys of the three pilot pages, as declared in
 * `src/pages/{Products,BoxTypes,Customers}.tsx`. Kept here rather than
 * exported from the pages (which build `columns` inline, closing over page
 * state) — this list is the coverage contract's other half; a page renaming a
 * column key without updating this list fails the "subset" assertion below.
 */
const PILOT_COLUMN_KEYS: Record<string, string[]> = {
  products: [
    'code',
    'clientCode',
    'customer',
    'description',
    'revision',
    'vip',
    'productType',
    'boxType',
    'history',
    'actions',
  ],
  'box-types': ['code', 'name', 'createdAt', 'history', 'actions'],
  customers: ['name', 'supplierCode', 'category', 'salesPerson', 'status', 'history', 'actions'],
};

const columnsFor = (listId: string): Column<any>[] =>
  (PILOT_COLUMN_KEYS[listId] ?? []).map((key) => ({ key, header: `Header:${key}` }));

describe('columnFilterDefs — coverage (C-3, AC-4)', () => {
  it.each(Object.keys(PILOT_COLUMN_KEYS))('every %s column key appears exactly once in the registry', (listId) => {
    const registryColumns = columnFilters[listId].filters.map((spec: ColumnFilterSpec) => spec.column);

    for (const key of PILOT_COLUMN_KEYS[listId]) {
      expect(registryColumns.filter((column) => column === key)).toHaveLength(1);
    }
  });

  it('returns [] for an unknown listId', () => {
    expect(columnFilterDefs('not-a-real-list', [], t)).toEqual([]);
  });
});

describe('columnFilterDefs — one def shape per kind', () => {
  it('text: debounced, advanced, label from the column header', () => {
    const defs = columnFilterDefs('products', columnsFor('products'), t);
    const code = defs.find((def) => def.key === 'code');

    expect(code).toEqual(
      expect.objectContaining({ kind: 'text', label: 'Header:code', advanced: true, debounceMs: 300 })
    );
  });

  it('boolean: a select with true/false options labelled sí/no, sending the registry param', () => {
    const defs = columnFilterDefs('products', columnsFor('products'), t);
    const vip = defs.find((def) => def.key === 'vip');

    expect(vip).toMatchObject({
      kind: 'select',
      advanced: true,
      options: [
        { value: 'true', label: 'Sí' },
        { value: 'false', label: 'No' },
      ],
    });
  });

  it('select: options labelled via filters.options.<value>, falling back to the raw value', () => {
    // approvalState is an "extra" registry row (not a products.tsx column):
    // its label falls back to `filters.columns.approvalState`, exercised by
    // the `date` case below for `createdAt` on the same fallback path.
    const defs = columnFilterDefs('products', columnsFor('products'), t);
    const approvalState = defs.find((def) => def.key === 'approvalState');

    expect(approvalState).toMatchObject({
      kind: 'select',
      advanced: true,
      options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'approved', label: 'Aprobado' },
        { value: 'cancelled', label: 'Cancelado' },
      ],
    });
  });

  it('date: a From/To pair sharing one label, sent as `<param>From`/`<param>To`', () => {
    const defs = columnFilterDefs('box-types', columnsFor('box-types'), t);
    const from = defs.find((def) => def.key === 'createdAtFrom');
    const to = defs.find((def) => def.key === 'createdAtTo');

    expect(from).toMatchObject({ kind: 'date', label: 'Header:createdAt · desde', advanced: true });
    expect(to).toMatchObject({ kind: 'date', label: 'Header:createdAt · hasta', advanced: true });
  });

  it('date/number: both halves carry `range.group/role/label` so FilterBar can render them as one cell (AC-3)', () => {
    const dateDefs = columnFilterDefs('box-types', columnsFor('box-types'), t);
    const dateFrom = dateDefs.find((def) => def.key === 'createdAtFrom');
    const dateTo = dateDefs.find((def) => def.key === 'createdAtTo');

    expect(dateFrom).toMatchObject({ range: { group: 'createdAt', role: 'from', label: 'Header:createdAt' } });
    expect(dateTo).toMatchObject({ range: { group: 'createdAt', role: 'to', label: 'Header:createdAt' } });

    const numberDefs = columnFilterDefs('products', columnsFor('products'), t);
    const numberFrom = numberDefs.find((def) => def.key === 'revisionFrom');
    const numberTo = numberDefs.find((def) => def.key === 'revisionTo');

    expect(numberFrom).toMatchObject({ range: { group: 'revision', role: 'from', label: 'Header:revision' } });
    expect(numberTo).toMatchObject({ range: { group: 'revision', role: 'to', label: 'Header:revision' } });
  });

  it('date: falls back to filters.columns.<column> when the spec is not a shown column', () => {
    // `createdAt` is not a Customers.tsx column; columnFilterDefs still emits
    // it (the DAO supports it), labelled from the i18n fallback.
    const defs = columnFilterDefs('customers', columnsFor('customers'), t);
    const from = defs.find((def) => def.key === 'createdAtFrom');

    expect(from).toMatchObject({ kind: 'date', label: 'Creado · desde' });
  });

  it('number: a From/To pair, keyed off the column when no param override is given', () => {
    const defs = columnFilterDefs('products', columnsFor('products'), t);
    const from = defs.find((def) => def.key === 'revisionFrom');
    const to = defs.find((def) => def.key === 'revisionTo');

    expect(from).toMatchObject({ kind: 'number', advanced: true });
    expect(to).toMatchObject({ kind: 'number', advanced: true });
  });

  it('entity: loadOptions comes from entityLoaders, keyed by the registry param', () => {
    const defs = columnFilterDefs('products', columnsFor('products'), t, { companyId: 'company-1' });
    const productType = defs.find((def) => def.key === 'productTypeUuid');

    expect(productType).toMatchObject({ kind: 'entity', label: 'Header:productType', advanced: true });
    expect(typeof (productType as any).loadOptions).toBe('function');
  });

  it('notFilterable columns (actions, history) never produce a def', () => {
    const defs = columnFilterDefs('products', columnsFor('products'), t);

    expect(defs.find((def) => def.key === 'actions')).toBeUndefined();
    expect(defs.find((def) => def.key === 'history')).toBeUndefined();
  });

  it('every generated def key traces back to a param the registry actually declares (L-007)', () => {
    for (const listId of Object.keys(PILOT_COLUMN_KEYS)) {
      const registry = columnFilters[listId];
      const declaredParams = new Set<string>();
      for (const spec of registry.filters) {
        if ('notFilterable' in spec) continue;
        const param = spec.param ?? spec.column;
        if (spec.kind === 'date' || spec.kind === 'number') {
          declaredParams.add(`${param}From`);
          declaredParams.add(`${param}To`);
        } else {
          declaredParams.add(param);
        }
      }

      const defs = columnFilterDefs(listId, columnsFor(listId), t, { companyId: 'company-1' });
      for (const def of defs) {
        expect(declaredParams.has(def.key)).toBe(true);
      }
    }
  });
});
