import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '../ui/SearchInput';
import Button from '../ui/Button';
import { ProductionOrderListFilters } from '../../types';

/** Every select is a tri-state: `''` (all) plus the two documented values. */
const SELECTS: Array<{
  key: 'schedulingState' | 'completionState' | 'voidState';
  labelKey: string;
  allKey: string;
  testId: string;
  options: Array<{ value: string; labelKey: string }>;
}> = [
  {
    key: 'schedulingState',
    labelKey: 'productionOrders.filters.scheduling',
    allKey: 'productionOrders.filters.allScheduling',
    testId: 'filter-scheduling-state',
    options: [
      { value: 'enabled', labelKey: 'productionOrders.filters.enabled' },
      { value: 'disabled', labelKey: 'productionOrders.filters.disabled' },
    ],
  },
  {
    key: 'completionState',
    labelKey: 'productionOrders.filters.completion',
    allKey: 'productionOrders.filters.allCompletion',
    testId: 'filter-completion-state',
    options: [
      { value: 'open', labelKey: 'productionOrders.filters.open' },
      { value: 'completed', labelKey: 'productionOrders.filters.completed' },
    ],
  },
  {
    key: 'voidState',
    labelKey: 'productionOrders.filters.void',
    allKey: 'productionOrders.filters.allVoid',
    testId: 'filter-void-state',
    options: [
      { value: 'active', labelKey: 'productionOrders.filters.active' },
      { value: 'voided', labelKey: 'productionOrders.filters.voided' },
    ],
  },
];

interface Props {
  value: ProductionOrderListFilters;
  onChange: (next: ProductionOrderListFilters) => void;
  search: string;
  onSearchChange: (next: string) => void;
  /** Drops every filter AND the free-text search back to the mount state. */
  onClear: () => void;
}

/**
 * The órdenes de producción filter bar.
 *
 * Fully controlled and presentational: it owns no list state and issues no
 * list request — same contract as `SalesOrdersFilterBar`. The grid holds the
 * filter object and hands it to `useEntityList`, which is what makes a filter
 * change reset to page 1.
 *
 * Every control carries a VISIBLE label. The two date inputs were previously
 * distinguished by `aria-label` alone, which left two identical boxes side by
 * side for a sighted user.
 */
const ProductionOrdersFilterBar: React.FC<Props> = ({
  value,
  onChange,
  search,
  onSearchChange,
  onClear,
}) => {
  const { t } = useTranslation();

  /** One whole filter object per change; empty values are omitted, not sent. */
  const emit = useCallback(
    (patch: Partial<ProductionOrderListFilters>) => {
      const next: ProductionOrderListFilters = { ...value, ...patch };
      for (const key of Object.keys(next) as Array<
        keyof ProductionOrderListFilters
      >) {
        if (next[key] === '' || next[key] === undefined) delete next[key];
      }
      onChange(next);
    },
    [onChange, value],
  );

  const activeCount =
    Object.values(value).filter(Boolean).length + (search.trim() ? 1 : 0);

  return (
    <div className="gd-filters" data-testid="production-orders-filter-bar">
      <div className="gd-filters-head">
        <span className="gd-eyebrow">
          {t('productionOrders.filters.legend')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={activeCount === 0}
          data-testid="filter-clear"
          onClick={onClear}
        >
          {t('productionOrders.filters.clear')}
        </Button>
      </div>

      <div className="gd-filters-grid">
        {/* Búsqueda libre por número */}
        <label className="gd-filters-field">
          <span className="gd-label">
            {t('productionOrders.filters.search')}
          </span>
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={t('productionOrders.searchPlaceholder')}
          />
        </label>

        {/* Habilitación / Cumplimiento / Anulación */}
        {SELECTS.map((select) => (
          <label key={select.key} className="gd-filters-field">
            <span className="gd-label">{t(select.labelKey)}</span>
            <select
              name={select.key}
              className="input-field"
              data-testid={select.testId}
              value={value[select.key] ?? ''}
              onChange={(event) => emit({ [select.key]: event.target.value })}
            >
              <option value="">{t(select.allKey)}</option>
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        ))}

        {/* Rango de fecha de entrega */}
        <label className="gd-filters-field">
          <span className="gd-label">
            {t('productionOrders.filters.deliveryFrom')}
          </span>
          <input
            name="deliveryDateFrom"
            type="date"
            className="input-field"
            data-testid="filter-delivery-from"
            aria-label={t('productionOrders.filters.deliveryFrom')}
            value={value.deliveryDateFrom ?? ''}
            onChange={(event) => emit({ deliveryDateFrom: event.target.value })}
          />
        </label>
        <label className="gd-filters-field">
          <span className="gd-label">
            {t('productionOrders.filters.deliveryTo')}
          </span>
          <input
            name="deliveryDateTo"
            type="date"
            className="input-field"
            data-testid="filter-delivery-to"
            aria-label={t('productionOrders.filters.deliveryTo')}
            value={value.deliveryDateTo ?? ''}
            onChange={(event) => emit({ deliveryDateTo: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
};

export default ProductionOrdersFilterBar;
