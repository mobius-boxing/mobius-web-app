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

interface FilterFieldProps {
  def: FilterDef;
  value: unknown;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}

/** One def's label + control — shared by the primary row and the advanced panel. */
const FilterField: React.FC<FilterFieldProps> = ({ def, value, disabled, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className={def.className ?? 'w-full sm:flex-1 sm:max-w-md'}>
      {def.label && (
        <label className="gd-label">
          {def.label}
          {def.required && (
            <span className="text-red-500 ml-1" aria-hidden="true" title={t('filters.required')}>
              *
            </span>
          )}
        </label>
      )}

      {def.kind === 'text' &&
        (def.debounceMs ? (
          <DebouncedTextField
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(def.key, next)}
            placeholder={def.placeholder}
            disabled={disabled}
            debounceMs={def.debounceMs}
            testId={def.testId}
          />
        ) : (
          <SearchInput
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(def.key, next)}
            placeholder={def.placeholder}
            disabled={disabled}
            data-testid={def.testId}
          />
        ))}

      {def.kind === 'number' && (
        <input
          type="number"
          data-testid={def.testId}
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(def.key, e.target.value === '' ? undefined : e.target.value)}
          placeholder={def.placeholder}
          min={def.min}
          max={def.max}
          disabled={disabled}
          className={CONTROL_CLASSNAME}
        />
      )}

      {def.kind === 'select' && (
        <select
          data-testid={def.testId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(def.key, e.target.value || undefined)}
          disabled={disabled}
          className={CONTROL_CLASSNAME}
        >
          <option value="">{def.placeholder ?? ''}</option>
          {def.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {def.kind === 'date' && (
        <input
          type="date"
          data-testid={def.testId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(def.key, e.target.value || undefined)}
          disabled={disabled}
          className={CONTROL_CLASSNAME}
        />
      )}

      {def.kind === 'entity' && (
        <EntityAutocomplete
          value={isFilterOption(value) ? (value as FilterOption) : undefined}
          onChange={(next) => onChange(def.key, next)}
          loadOptions={def.loadOptions}
          placeholder={def.placeholder}
          minChars={def.minChars}
          disabled={disabled}
          aria-label={def.label}
          data-testid={def.testId}
        />
      )}
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({ defs, values, onChange, className = '' }) => {
  const { t } = useTranslation();
  const requiredUnmet = defs.some((def) => def.required && !hasValue(values[def.key]));
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = `filter-bar-advanced-panel-${useId()}`;

  const primaryDefs = defs.filter((def) => !def.advanced);
  // I-4: required defs are never advanced, but the filter below is defensive
  // against a def that is mistakenly marked both.
  const advancedDefs = defs.filter((def) => def.advanced && !def.required);
  const advancedValueCount = advancedDefs.filter((def) => hasValue(values[def.key])).length;

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

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-3">
        {primaryDefs.map((def) => (
          <FilterField
            key={def.key}
            def={def}
            value={values[def.key]}
            disabled={def.disabled || (!def.required && requiredUnmet)}
            onChange={onChange}
          />
        ))}

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

      {advancedDefs.length > 0 && panelOpen && (
        <div id={panelId} className="mt-3 grid gap-3 sm:grid-cols-3">
          {advancedDefs.map((def) => (
            <FilterField
              key={def.key}
              def={def}
              value={values[def.key]}
              disabled={def.disabled || requiredUnmet}
              onChange={onChange}
            />
          ))}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearAdvanced}
              disabled={requiredUnmet}
              className="py-2 px-3 text-sm text-secondary-600 hover:text-secondary-900 disabled:text-secondary-400 disabled:cursor-not-allowed"
            >
              {t('filters.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
