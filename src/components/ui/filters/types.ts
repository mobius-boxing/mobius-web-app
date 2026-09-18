export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBase {
  /** Key in the values record AND the API query param name. */
  key: string;
  /** Already translated. */
  label: string;
  /** Mandatory: the list does not fetch until this has a value. */
  required?: boolean;
  placeholder?: string;
  /** Width hint, e.g. 'sm:w-72'. */
  className?: string;
  /**
   * Forces the control disabled regardless of the required-filter gate — for
   * a field whose OWN prerequisite lives outside `FilterBar` (e.g. the
   * pedido item lookup, which needs an item type picked first).
   */
  disabled?: boolean;
  /** `data-testid` on the rendered control, for a page migrating off a bespoke bar. */
  testId?: string;
  /** Rendered inside the collapsible "advanced filters" panel, not the primary row. */
  advanced?: boolean;
}

export interface TextFilterDef extends FilterBase {
  kind: 'text';
  /**
   * Debounces `onChange` with a local draft instead of firing per keystroke.
   * The `search` key ignores this — it already rides `useEntityList`'s own
   * debounce.
   */
  debounceMs?: number;
}

export interface SelectFilterDef extends FilterBase {
  kind: 'select';
  options: FilterOption[];
}

export interface EntityFilterDef extends FilterBase {
  kind: 'entity';
  loadOptions: (search: string) => Promise<FilterOption[]>;
  /** Default 0 (opens with the first page on focus). */
  minChars?: number;
}

/** A bare calendar day (`<input type="date">`); no time component. */
export interface DateFilterDef extends FilterBase {
  kind: 'date';
}

export interface NumberFilterDef extends FilterBase {
  kind: 'number';
  min?: number;
  max?: number;
}

export type FilterDef = TextFilterDef | SelectFilterDef | EntityFilterDef | DateFilterDef | NumberFilterDef;

export type FilterValues = Record<string, string | undefined>;

/**
 * Entity filters store the selected option (value + label) so the control can
 * render the label without a lookup; the query param is `option.value`.
 */
export type FilterState = Record<string, string | FilterOption | undefined>;

export interface FilterBarProps {
  defs: FilterDef[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  className?: string;
}

/** A `key: 'search'` text def renders as the page's standard search box (not debounced by `FilterBar` itself — `useEntityList` already debounces `search`). */
export function searchFilter(placeholder: string): TextFilterDef {
  return { kind: 'text', key: 'search', label: '', placeholder };
}

export function isFilterOption(value: unknown): value is FilterOption {
  return typeof value === 'object' && value !== null && 'value' in value && 'label' in value;
}

export function toQueryParams(state: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined || value === null || value === '') continue;
    const resolved = isFilterOption(value) ? value.value : value;
    if (resolved === undefined || resolved === null || resolved === '') continue;
    params[key] = typeof resolved === 'string' ? resolved : String(resolved);
  }
  return params;
}

export function requiredFiltersSatisfied(defs: FilterDef[], state: Record<string, unknown>): boolean {
  return defs.every((def) => {
    if (!def.required) return true;
    const value = state[def.key];
    if (value === undefined || value === null || value === '') return false;
    return isFilterOption(value) ? value.value !== '' : true;
  });
}
