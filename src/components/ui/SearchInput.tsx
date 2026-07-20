import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
  disabled?: boolean;
}

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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className="h-5 w-5 text-secondary-400"
          aria-hidden="true"
        />
      </div>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || t('common.search')}
        disabled={disabled}
        className={`
          block w-full pl-10 pr-10 py-2
          bg-white border border-secondary-300 rounded-lg
          text-sm text-secondary-900 placeholder-secondary-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
          disabled:bg-secondary-100 disabled:cursor-not-allowed
        `}
        aria-label={placeholder || t('common.search')}
      />

      {showClear && hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label={t('common.clear')}
        >
          <X
            className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
