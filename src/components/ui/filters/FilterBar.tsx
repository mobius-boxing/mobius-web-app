import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBarProps, FilterOption, isFilterOption } from './types';
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

export const FilterBar: React.FC<FilterBarProps> = ({ defs, values, onChange, className = '' }) => {
  const { t } = useTranslation();
  const requiredUnmet = defs.some((def) => def.required && !hasValue(values[def.key]));

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      {defs.map((def) => {
        const value = values[def.key];
        // The required filter itself stays enabled (it is the gate); every
        // other control is disabled until it has a value. `def.disabled`
        // is an independent override for a prerequisite FilterBar knows
        // nothing about (e.g. the pedido item lookup needs a type picked).
        const disabled = def.disabled || (!def.required && requiredUnmet);

        return (
          <div key={def.key} className={def.className ?? 'w-full sm:flex-1 sm:max-w-md'}>
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
      })}
    </div>
  );
};

export default FilterBar;
