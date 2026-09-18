import { Translate } from '../validation/fields';
import { Column } from '../components/ui/Table';
import { FilterDef } from '../components/ui/filters/types';
import { entityLoaders, EntityKind } from './entityLoaders';
import registryJson from './columnFilters.json';

export type { EntityKind } from './entityLoaders';

export type ColumnFilterKind = 'text' | 'boolean' | 'select' | 'date' | 'number' | 'entity';

export type ColumnFilterSpec =
  | { column: string; kind: ColumnFilterKind; param?: string; entity?: EntityKind; options?: string[] }
  | { column: string; notFilterable: 'actions' | 'aggregate' | 'computed' };

export interface ListFilterRegistry {
  endpoint: string;
  filters: ColumnFilterSpec[];
}

/** The web↔API contract (`column-filters/model.md`); one entry per listId. */
export const columnFilters = registryJson as unknown as Record<string, ListFilterRegistry>;

const isNotFilterable = (
  spec: ColumnFilterSpec,
): spec is { column: string; notFilterable: 'actions' | 'aggregate' | 'computed' } =>
  'notFilterable' in spec;

/**
 * Registry rows → `FilterDef`s for the advanced panel (L-007: only params the
 * registry names). `columns` supplies labels — a spec's `column` that matches
 * a page `Column.key` uses that column's header; otherwise the fallback i18n
 * key `filters.columns.<column>` (C-3), e.g. `products.createdAt` isn't a
 * shown column but still needs a label.
 */
export function columnFilterDefs(
  listId: string,
  columns: Column<any>[],
  t: Translate,
  options: { companyId?: string } = {},
): FilterDef[] {
  const entry = columnFilters[listId];
  if (!entry) return [];

  const defs: FilterDef[] = [];

  for (const spec of entry.filters) {
    if (isNotFilterable(spec)) continue;

    const pageColumn = columns.find((column) => column.key === spec.column);
    const label = pageColumn ? pageColumn.header : t(`filters.columns.${spec.column}`);
    const param = spec.param ?? spec.column;

    switch (spec.kind) {
      case 'text':
        defs.push({ kind: 'text', key: param, label, advanced: true, debounceMs: 300 });
        break;

      case 'boolean':
        defs.push({
          kind: 'select',
          key: param,
          label,
          advanced: true,
          options: [
            { value: 'true', label: t('filters.boolean.yes') },
            { value: 'false', label: t('filters.boolean.no') },
          ],
        });
        break;

      case 'select':
        defs.push({
          kind: 'select',
          key: param,
          label,
          advanced: true,
          // i18next's own `defaultValue` fallback: the raw option value stands
          // in for any `filters.options.<value>` key the locale files don't
          // carry, without a separate `i18n.exists()` import that would tie
          // this module to a live i18next instance (page tests mock
          // `react-i18next` wholesale and never initialize one).
          options: (spec.options ?? []).map((value) => ({
            value,
            label: t(`filters.options.${value}`, { defaultValue: value }),
          })),
        });
        break;

      case 'date':
      case 'number':
        defs.push({
          kind: spec.kind,
          key: `${param}From`,
          label: `${label} · ${t('filters.range.from')}`,
          advanced: true,
        } as FilterDef);
        defs.push({
          kind: spec.kind,
          key: `${param}To`,
          label: `${label} · ${t('filters.range.to')}`,
          advanced: true,
        } as FilterDef);
        break;

      case 'entity':
        if (!spec.entity) break;
        defs.push({
          kind: 'entity',
          key: param,
          label,
          advanced: true,
          loadOptions: entityLoaders[spec.entity](options.companyId),
        });
        break;
    }
  }

  return defs;
}
