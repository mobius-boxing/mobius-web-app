import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text (default: translated 'common.search') */
  placeholder?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show the clear button (default: true when value is not empty) */
  showClear?: boolean;
  /** Disable the input */
  disabled?: boolean;
}

/**
 * Reusable search input component with icon and clear button
 *
 * Features:
 * - Search icon on the left
 * - Clear button appears when there's input
 * - Translatable placeholder
 * - Accessible design
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder={t('suppliers.searchPlaceholder')}
 * />
 * ```
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  showClear = true,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const hasValue = value.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </div>

      {/* Input field */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || t('common.search')}
        disabled={disabled}
        className={`
          block w-full pl-10 pr-10 py-2
          border border-gray-300 rounded-lg
          text-sm text-gray-900 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
        aria-label={placeholder || t('common.search')}
      />

      {/* Clear button */}
      {showClear && hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label={t('common.clear')}
        >
          <X
            className="h-5 w-5 text-gray-400 hover:text-gray-600"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
