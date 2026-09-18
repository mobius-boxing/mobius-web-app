import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronsUpDown, Loader2, X } from 'lucide-react';
import { FilterOption } from './types';

interface EntityAutocompleteProps {
  value: FilterOption | undefined;
  onChange: (next: FilterOption | undefined) => void;
  loadOptions: (search: string) => Promise<FilterOption[]>;
  placeholder?: string;
  minChars?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

const DEBOUNCE_MS = 300;

export const EntityAutocomplete: React.FC<EntityAutocompleteProps> = ({
  value,
  onChange,
  loadOptions,
  placeholder,
  minChars = 0,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;

  useEffect(() => {
    setText(value?.label ?? '');
  }, [value]);

  const runSearch = useCallback(
    (term: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      loadOptions(term)
        .then((results) => {
          if (requestIdRef.current !== requestId) return; // a later keystroke superseded this response
          setOptions(results);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setOptions([]);
        })
        .finally(() => {
          if (requestIdRef.current === requestId) setLoading(false);
        });
    },
    [loadOptions]
  );

  useEffect(() => {
    if (!open || text.length < minChars) return;
    if (text.length === 0) {
      runSearch(text);
      return;
    }
    const handle = setTimeout(() => runSearch(text), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [open, text, minChars, runSearch]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleFocus = () => {
    setOpen(true);
    setHighlighted(-1);
  };

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
    setHighlighted(-1);
    setOpen(true);
    if (value) onChange(undefined);
  };

  const selectOption = (option: FilterOption) => {
    onChange(option);
    setText(option.label);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleClear = () => {
    onChange(undefined);
    setText('');
    setOptions([]);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlighted((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && highlighted >= 0 && options[highlighted]) {
        event.preventDefault();
        selectOption(options[highlighted]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const activeOptionId =
    highlighted >= 0 && options[highlighted] ? `${listboxId}-option-${highlighted}` : undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          id={id}
          data-testid={testId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-label={ariaLabel}
          type="text"
          value={text}
          disabled={disabled}
          onFocus={handleFocus}
          onChange={handleChangeText}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-3 pr-16 py-2 bg-white border border-secondary-300 rounded-lg text-sm text-secondary-900 placeholder-secondary-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 text-secondary-400 animate-spin" aria-hidden="true" />
          )}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t('common.clear')}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <ChevronsUpDown className="h-4 w-4 text-secondary-300" aria-hidden="true" />
        </div>
      </div>

      {open && !disabled && (
        <ul
          role="listbox"
          id={listboxId}
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-secondary-200 bg-white shadow-lg py-1 text-sm"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2 text-secondary-500">{t('filters.loading')}</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-secondary-500">{t('filters.noResults')}</li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={value?.value === option.value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`px-3 py-2 cursor-pointer ${
                  highlighted === index ? 'bg-primary-50 text-primary-700' : 'text-secondary-900'
                }`}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default EntityAutocomplete;
