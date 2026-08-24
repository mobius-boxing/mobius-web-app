import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '../ui/SearchInput';
import Button from '../ui/Button';
import { SalesOrderListFilters } from '../../types';
import {
  customersApi,
  partsApi,
  paperSheetsApi,
  productsApi,
} from '../../services/api';
import { logger } from '../../utils/logger';

/** The exclusive `radioTipoPedido` trio (PedidosForm.cs:258-260). */
type ItemType = '' | 'product' | 'part' | 'sheet';

const ITEM_TYPES: Array<{ value: Exclude<ItemType, ''>; labelKey: string }> = [
  { value: 'product', labelKey: 'salesOrders.filters.product' },
  { value: 'part', labelKey: 'salesOrders.filters.part' },
  { value: 'sheet', labelKey: 'salesOrders.filters.sheet' },
];

/** Checkbox → the filter key it drives. Checked always sends `'true'`. */
const CHECKBOXES: Array<{
  key: 'fulfilled' | 'voided' | 'withoutProductionOrders' | 'allProductionOrdersFulfilled';
  labelKey: string;
  testId: string;
}> = [
  {
    key: 'fulfilled',
    labelKey: 'salesOrders.filters.fulfilled',
    testId: 'filter-fulfilled',
  },
  {
    key: 'voided',
    labelKey: 'salesOrders.filters.voided',
    testId: 'filter-voided',
  },
  {
    key: 'withoutProductionOrders',
    labelKey: 'salesOrders.filters.withoutProductionOrders',
    testId: 'filter-without-orders',
  },
  {
    key: 'allProductionOrdersFulfilled',
    labelKey: 'salesOrders.filters.allProductionOrdersFulfilled',
    testId: 'filter-all-orders-fulfilled',
  },
];

interface Option {
  uuid: string;
  label: string;
}

interface Props {
  value: SalesOrderListFilters;
  onChange: (next: SalesOrderListFilters) => void;
  search: string;
  onSearchChange: (next: string) => void;
  /** Restores the mount-time filter state (PedidosForm.cs:489-490). */
  onClear: () => void;
  companyId?: string;
}

/**
 * The pedido filter bar (`PedidosForm.ActualizarGrilla`, PedidosForm.cs:252-273).
 *
 * Fully controlled and presentational: it owns no list state and issues no
 * list request. The only fetching it does is the four lookup option lists.
 *
 * `Cumplidos` / `Anulados` SWITCH the list (checked ⇒ only fulfilled / only
 * voided); unchecked sends an explicit `false`, which is what makes the grid
 * hide fulfilled and voided pedidos by default — parity with
 * `PedidoRepository.cs:89-97`, not an "also include" toggle.
 */
const SalesOrdersFilterBar: React.FC<Props> = ({
  value,
  onChange,
  search,
  onSearchChange,
  onClear,
  companyId,
}) => {
  const { t } = useTranslation();
  const [itemType, setItemType] = useState<ItemType>('');
  const [customers, setCustomers] = useState<Option[]>([]);
  const [itemOptions, setItemOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const page = await customersApi.getCustomers({
          limit: 100,
          ...(companyId ? { companyId } : {}),
        });
        if (cancelled) return;
        setCustomers(
          page.data.map((customer) => ({
            uuid: customer.uuid,
            label: customer.name ?? customer.uuid,
          })),
        );
      } catch (error) {
        logger.error('Error loading customers for the pedido filter:', error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!itemType) {
        setItemOptions([]);
        return;
      }
      const scope = companyId ? { companyId } : {};
      try {
        if (itemType === 'product') {
          const page = await productsApi.getProducts({ limit: 100, ...scope });
          if (!cancelled) {
            setItemOptions(
              page.data.map((product) => ({
                uuid: product.uuid,
                label: `${product.code} - ${product.description ?? ''}`.trim(),
              })),
            );
          }
          return;
        }
        if (itemType === 'part') {
          const page = await partsApi.getParts({ limit: 100, ...scope });
          if (!cancelled) {
            setItemOptions(
              page.data.map((part) => ({
                uuid: part.uuid,
                label: `${part.code ?? ''} - ${part.description ?? ''}`.trim(),
              })),
            );
          }
          return;
        }
        const page = await paperSheetsApi.getPaperSheets({
          limit: 100,
          ...scope,
        });
        if (!cancelled) {
          setItemOptions(
            page.data.map((sheet) => ({
              uuid: sheet.uuid,
              label: `${sheet.code} - ${sheet.name ?? ''}`.trim(),
            })),
          );
        }
      } catch (error) {
        logger.error('Error loading the pedido item lookup:', error);
        if (!cancelled) setItemOptions([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [itemType, companyId]);

  /** One whole filter object per change; empty values are omitted, not sent. */
  const emit = useCallback(
    (patch: Partial<SalesOrderListFilters>) => {
      const next: SalesOrderListFilters = { ...value, ...patch };
      for (const key of Object.keys(next) as Array<
        keyof SalesOrderListFilters
      >) {
        if (next[key] === '' || next[key] === undefined) delete next[key];
      }
      onChange(next);
    },
    [onChange, value],
  );

  /** Selecting a type clears the other two uuids — at most one is ever sent. */
  const selectItemType = (next: ItemType) => {
    setItemType(next);
    emit({
      productUuid: undefined,
      partUuid: undefined,
      sheetSupplyUuid: undefined,
    });
  };

  /** null with no radio selected — never a silent fallback to one of the three. */
  const itemUuidKey: keyof SalesOrderListFilters | null =
    itemType === 'product'
      ? 'productUuid'
      : itemType === 'part'
        ? 'partUuid'
        : itemType === 'sheet'
          ? 'sheetSupplyUuid'
          : null;

  const handleClear = () => {
    setItemType('');
    setItemOptions([]);
    onClear();
  };

  return (
    <div
      className="space-y-3 rounded-lg border border-secondary-200 bg-white p-4 shadow-sm"
      data-testid="sales-orders-filter-bar"
    >
      {/* Row 1 — número, cliente, rango de fecha de entrega */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="text-sm text-secondary-700">
          {t('salesOrders.filters.number')}
          <input
            type="text"
            name="number"
            className="input-field mt-1"
            data-testid="filter-number"
            value={value.number ?? ''}
            onChange={(event) => emit({ number: event.target.value })}
          />
        </label>
        <label className="text-sm text-secondary-700">
          {t('salesOrders.filters.customer')}
          <select
            name="customerUuid"
            className="input-field mt-1"
            data-testid="filter-customer"
            value={value.customerUuid ?? ''}
            onChange={(event) => emit({ customerUuid: event.target.value })}
          >
            <option value="">{t('salesOrders.filters.allCustomers')}</option>
            {customers.map((customer) => (
              <option key={customer.uuid} value={customer.uuid}>
                {customer.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-secondary-700">
          {t('salesOrders.filters.deliveryDateFrom')}
          <input
            type="date"
            name="deliveryDateFrom"
            className="input-field mt-1"
            data-testid="filter-delivery-from"
            value={value.deliveryDateFrom ?? ''}
            onChange={(event) =>
              emit({ deliveryDateFrom: event.target.value })
            }
          />
        </label>
        <label className="text-sm text-secondary-700">
          {t('salesOrders.filters.deliveryDateTo')}
          <input
            type="date"
            name="deliveryDateTo"
            className="input-field mt-1"
            data-testid="filter-delivery-to"
            value={value.deliveryDateTo ?? ''}
            onChange={(event) => emit({ deliveryDateTo: event.target.value })}
          />
        </label>
      </div>

      {/* Row 2 — the exclusive producto / parte / plancha trio */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-3">
          {ITEM_TYPES.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-1 text-sm text-secondary-700"
            >
              <input
                type="radio"
                name="itemType"
                value={option.value}
                data-testid={`filter-type-${option.value}`}
                checked={itemType === option.value}
                onChange={() => selectItemType(option.value)}
              />
              {t(option.labelKey)}
            </label>
          ))}
          <Button
            variant="ghost"
            size="sm"
            data-testid="filter-type-clear"
            onClick={() => selectItemType('')}
          >
            {t('salesOrders.filters.clearType')}
          </Button>
        </div>
        <select
          name="itemUuid"
          className="input-field w-72"
          data-testid="filter-item"
          disabled={!itemUuidKey}
          value={itemUuidKey ? (value[itemUuidKey] ?? '') : ''}
          onChange={(event) => {
            if (itemUuidKey) emit({ [itemUuidKey]: event.target.value });
          }}
        >
          <option value="">{t('salesOrders.filters.allItems')}</option>
          {itemOptions.map((option) => (
            <option key={option.uuid} value={option.uuid}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 3 — the four checkboxes */}
      <div className="flex flex-wrap items-center gap-4">
        {CHECKBOXES.map((checkbox) => (
          <label
            key={checkbox.key}
            className="flex items-center gap-1 text-sm text-secondary-700"
          >
            <input
              type="checkbox"
              name={checkbox.key}
              data-testid={checkbox.testId}
              checked={value[checkbox.key] === 'true'}
              onChange={(event) =>
                emit({
                  [checkbox.key]: event.target.checked ? 'true' : 'false',
                })
              }
            />
            {t(checkbox.labelKey)}
          </label>
        ))}
      </div>

      {/* Row 4 — búsqueda libre y Limpiar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={t('salesOrders.searchPlaceholder')}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          data-testid="filter-clear"
          onClick={handleClear}
        >
          {t('salesOrders.filters.clear')}
        </Button>
      </div>
    </div>
  );
};

export default SalesOrdersFilterBar;
