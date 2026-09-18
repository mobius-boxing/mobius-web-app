import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { FilterBarProps, FilterDef, FilterOption, isFilterOption } from './types';
import { EntityAutocomplete } from './EntityAutocomplete';
import { SearchInput } from '../SearchInput';

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  return isFilterOption(value) ? value.value !== '' : true;
}

/** Shared select/date styling — matches `SearchInput`/`Input` (border-secondary-300, focus ring primary-500/30). */
const CONTROL_CLASSNAME =
  'block w-full py-2 px-3 bg-white border border-secondary-300 rounded-lg text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed';

/** The default field width for a def with no explicit `className`. */
const DEFAULT_FIELD_WIDTH = 'w-full sm:flex-1 sm:max-w-md';

interface DebouncedTextFieldProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  debounceMs: number;
  testId?: string;
}

/**
 * A local draft plus a commit delay, for a text filter that would otherwise
 * put one request on the wire per keystroke (the audit log's username box).
 */
const DebouncedTextField: React.FC<DebouncedTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  debounceMs,
  testId,
}) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const handle = setTimeout(() => onChange(draft), debounceMs);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs]);

  return (
    <SearchInput
      value={draft}
      onChange={setDraft}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={testId}
    />
  );
};

interface FilterControlProps {
  def: FilterDef;
  value: unknown;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  /** Overrides `def.label` as the control's own `aria-label` — used by a range cell, whose visible label is the shared group caption. */
  ariaLabel?: string;
  /** Overrides `def.placeholder` — used by a range cell's number inputs (`filters.range.from`/`to`). */
  placeholder?: string;
}

/** Renders just the input/select/autocomplete for one def — no label, shared by a plain field cell and a range cell's two halves. */
const FilterControl: React.FC<FilterControlProps> = ({ def, value, disabled, onChange, ariaLabel, placeholder }) => {
  const resolvedPlaceholder = placeholder ?? def.placeholder;

  if (def.kind === 'text') {
    return def.debounceMs ? (
      <DebouncedTextField
        value={typeof value === 'string' ? value : ''}
        onChange={(next) => onChange(def.key, next)}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        debounceMs={def.debounceMs}
        testId={def.testId}
      />
    ) : (
      <SearchInput
        value={typeof value === 'string' ? value : ''}
        onChange={(next) => onChange(def.key, next)}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        data-testid={def.testId}
      />
    );
  }

  if (def.kind === 'number') {
    return (
      <input
        type="number"
        data-testid={def.testId}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(def.key, e.target.value === '' ? undefined : e.target.value)}
        placeholder={resolvedPlaceholder}
        min={def.min}
        max={def.max}
        disabled={disabled}
        aria-label={ariaLabel}
        className={CONTROL_CLASSNAME}
      />
    );
  }

  if (def.kind === 'select') {
    return (
      <select
        data-testid={def.testId}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(def.key, e.target.value || undefined)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={CONTROL_CLASSNAME}
      >
        <option value="">{resolvedPlaceholder ?? ''}</option>
        {def.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (def.kind === 'date') {
    return (
      <input
        type="date"
        data-testid={def.testId}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(def.key, e.target.value || undefined)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={CONTROL_CLASSNAME}
      />
    );
  }

  return (
    <EntityAutocomplete
      value={isFilterOption(value) ? (value as FilterOption) : undefined}
      onChange={(next) => onChange(def.key, next)}
      loadOptions={def.loadOptions}
      placeholder={resolvedPlaceholder}
      minChars={def.minChars}
      disabled={disabled}
      aria-label={ariaLabel ?? def.label}
      data-testid={def.testId}
    />
  );
};

type FieldVariant = 'primary' | 'panel';

interface FilterFieldProps {
  def: FilterDef;
  value: unknown;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  variant: FieldVariant;
}

/** A plain (non-range) field cell: label always rendered (a same-height placeholder when there is none), control pinned to the bottom via `mt-auto`. */
const FilterField: React.FC<FilterFieldProps> = ({ def, value, disabled, onChange, variant }) => {
  const { t } = useTranslation();
  const cellClassName =
    variant === 'primary' ? `flex flex-col ${def.className ?? DEFAULT_FIELD_WIDTH}` : 'flex flex-col';

  return (
    <div className={cellClassName}>
      {def.label ? (
        <label className="gd-label truncate" title={def.label}>
          {def.label}
          {def.required && (
            <span className="text-red-500 ml-1" aria-hidden="true" title={t('filters.required')}>
              *
            </span>
          )}
        </label>
      ) : (
        <span className="gd-label invisible" aria-hidden="true">
          ·
        </span>
      )}

      <div className="mt-auto">
        <FilterControl def={def} value={value} disabled={disabled} onChange={onChange} />
      </div>
    </div>
  );
};

interface FilterRangeFieldProps {
  label: string;
  defs: FilterDef[];
  values: Record<string, unknown>;
  isDisabled: (def: FilterDef) => boolean;
  onChange: (key: string, value: unknown) => void;
  variant: FieldVariant;
}

/** A from/to range cell (AC-3): one shared caption, two controls side by side, each keeping its own def's label as an `aria-label`. */
const FilterRangeField: React.FC<FilterRangeFieldProps> = ({ label, defs, values, isDisabled, onChange, variant }) => {
  const { t } = useTranslation();
  const firstDef = defs[0];
  const cellClassName =
    variant === 'primary' ? `flex flex-col ${firstDef.className ?? DEFAULT_FIELD_WIDTH}` : 'flex flex-col';

  return (
    <div className={cellClassName}>
      <label className="gd-label truncate" title={label}>
        {label}
      </label>
      <div className="mt-auto grid grid-cols-2 gap-2">
        {defs.map((def) => (
          <FilterControl
            key={def.key}
            def={def}
            value={values[def.key]}
            disabled={isDisabled(def)}
            onChange={onChange}
            ariaLabel={def.label}
            placeholder={def.kind === 'number' && def.range ? t(`filters.range.${def.range.role}`) : def.placeholder}
          />
        ))}
      </div>
    </div>
  );
};

type FilterCell =
  | { type: 'field'; def: FilterDef }
  | { type: 'range'; group: string; label: string; defs: FilterDef[] };

/** Groups CONSECUTIVE defs sharing the same `range.group` into one cell; everything else renders as today. */
function groupByRange(defs: FilterDef[]): FilterCell[] {
  const cells: FilterCell[] = [];
  for (const def of defs) {
    const last = cells[cells.length - 1];
    if (def.range && last?.type === 'range' && last.group === def.range.group) {
      last.defs.push(def);
      continue;
    }
    cells.push(def.range ? { type: 'range', group: def.range.group, label: def.range.label, defs: [def] } : { type: 'field', def });
  }
  return cells;
}

const cellKey = (cell: FilterCell): string => (cell.type === 'range' ? `range-${cell.group}` : cell.def.key);

export const FilterBar: React.FC<FilterBarProps> = ({ defs, values, onChange, className = '', children }) => {
  const { t } = useTranslation();
  const requiredUnmet = defs.some((def) => def.required && !hasValue(values[def.key]));
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = `filter-bar-advanced-panel-${useId()}`;

  const primaryDefs = defs.filter((def) => !def.advanced);
  // I-4: required defs are never advanced, but the filter below is defensive
  // against a def that is mistakenly marked both.
  const advancedDefs = defs.filter((def) => def.advanced && !def.required);
  const advancedValueCount = advancedDefs.filter((def) => hasValue(values[def.key])).length;

  const primaryCells = groupByRange(primaryDefs);
  const advancedCells = groupByRange(advancedDefs);

  // Opens the panel the moment an advanced filter gets a value — e.g. a value
  // restored from a prior session, or set some other way than this panel's
  // own controls — without re-forcing it open on every unrelated re-render.
  useEffect(() => {
    if (advancedValueCount > 0) setPanelOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleClearAdvanced = () => {
    advancedDefs.forEach((def) => onChange(def.key, undefined));
  };

  const isPrimaryDisabled = (def: FilterDef) => def.disabled || (!def.required && requiredUnmet);
  const isAdvancedDisabled = (def: FilterDef) => def.disabled || requiredUnmet;

  return (
    <div className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}>
      <div className="flex flex-wrap items-end gap-3">
        {primaryCells.map((cell) =>
          cell.type === 'range' ? (
            <FilterRangeField
              key={cellKey(cell)}
              label={cell.label}
              defs={cell.defs}
              values={values}
              isDisabled={isPrimaryDisabled}
              onChange={onChange}
              variant="primary"
            />
          ) : (
            <FilterField
              key={cellKey(cell)}
              def={cell.def}
              value={values[cell.def.key]}
              disabled={isPrimaryDisabled(cell.def)}
              onChange={onChange}
              variant="primary"
            />
          ),
        )}

        {advancedDefs.length > 0 && (
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            disabled={requiredUnmet}
            aria-expanded={panelOpen}
            aria-controls={panelId}
            className="inline-flex items-center gap-2 py-2 px-3 border border-secondary-300 rounded-lg text-sm text-secondary-700 hover:bg-secondary-50 disabled:bg-secondary-100 disabled:cursor-not-allowed disabled:text-secondary-400"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t('filters.advanced')}
            {advancedValueCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                {advancedValueCount}
              </span>
            )}
          </button>
        )}
      </div>

      {children}

      {advancedDefs.length > 0 && panelOpen && (
        <div id={panelId} className="mt-1 pt-3 border-t border-secondary-200">
          <div className="flex items-center justify-between mb-3">
            <span className="gd-label">{t('filters.advanced')}</span>
            <button
              type="button"
              onClick={handleClearAdvanced}
              disabled={requiredUnmet}
              className="text-xs text-secondary-600 hover:text-secondary-900 disabled:text-secondary-400 disabled:cursor-not-allowed"
            >
              {t('filters.clear')}
            </button>
          </div>

          <div className="gd-filters-grid">
            {advancedCells.map((cell) =>
              cell.type === 'range' ? (
                <FilterRangeField
                  key={cellKey(cell)}
                  label={cell.label}
                  defs={cell.defs}
                  values={values}
                  isDisabled={isAdvancedDisabled}
                  onChange={onChange}
                  variant="panel"
                />
              ) : (
                <FilterField
                  key={cellKey(cell)}
                  def={cell.def}
                  value={values[cell.def.key]}
                  disabled={isAdvancedDisabled(cell.def)}
                  onChange={onChange}
                  variant="panel"
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
