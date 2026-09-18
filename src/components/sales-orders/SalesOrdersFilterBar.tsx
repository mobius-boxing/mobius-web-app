import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '../ui/SearchInput';
import Button from '../ui/Button';
import { FilterBar, FilterDef, FilterOption } from '../ui/filters';
import { SalesOrderListFilters } from '../../types';
import { customersApi, paperSheetsApi, productsApi } from '../../services/api';
import { logger } from '../../utils/logger';

/** The exclusive `radioTipoPedido` pair (PedidosForm.cs:258-260; 'parte' removed). */
type ItemType = '' | 'product' | 'sheet';

const ITEM_TYPES: Array<{ value: Exclude<ItemType, ''>; labelKey: string }> = [
  { value: 'product', labelKey: 'salesOrders.filters.product' },
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
 * list request beyond the entity lookups. State stays with the grid
 * (`SalesOrderListFilters`, plain strings — the API contract), which is why
 * cliente/producto each keep a LOCAL `FilterOption` cache here: it is
 * what lets the autocomplete show a label without re-resolving the uuid.
 *
 * `Cumplidos` / `Anulados` SWITCH the list (checked ⇒ only fulfilled / only
 * voided); unchecked sends an explicit `false`, which is what makes the grid
 * hide fulfilled and voided pedidos by default — parity with
 * `PedidoRepository.cs:89-97`, not an "also include" toggle. Neither fits a
 * generic `FilterDef` kind, so — like the radio pair and the free plancha
 * lookup, which the brief left unconverted — they stay bespoke, driven by
 * the very same `emit`.
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
  const [customerOption, setCustomerOption] = useState<FilterOption>();
  const [productOption, setProductOption] = useState<FilterOption>();
  const [sheetOptions, setSheetOptions] = useState<Option[]>([]);

  // The plain-string uuid is the source of truth (it is what `value` carries
  // and what `Limpiar` restores); the cached label follows it down rather
  // than the other way around.
  useEffect(() => {
    if (!value.customerUuid) setCustomerOption(undefined);
  }, [value.customerUuid]);
  useEffect(() => {
    if (!value.productUuid) setProductOption(undefined);
  }, [value.productUuid]);

  const companyScope = useCallback(
    () => (companyId ? { companyId } : {}),
    [companyId],
  );

  const customerScope = useCallback(
    () => (customerOption ? { customerUuid: customerOption.value } : {}),
    [customerOption],
  );

  const loadCustomerOptions = useCallback(
    (term: string) =>
      customersApi
        .getCustomers({ search: term, limit: 20, ...companyScope() })
        .then((page) =>
          page.data.map((customer) => ({
            value: customer.uuid,
            label: customer.name ?? customer.uuid,
          })),
        )
        .catch((error) => {
          logger.error('Error loading customers for the pedido filter:', error);
          return [];
        }),
    [companyScope],
  );

  /**
   * Producto narrows to the chosen cliente once there is one; with none
   * picked it searches the whole company, so the list can still be filtered by
   * item alone as it always could.
   */
  const loadProductOptions = useCallback(
    (term: string) => {
      return productsApi
        .getProducts({ search: term, limit: 20, ...customerScope(), ...companyScope() })
        .then((page) =>
          page.data.map((product) => ({
            value: product.uuid,
            label: `${product.code} - ${product.description ?? ''}`.trim(),
          })),
        )
        .catch((error) => {
          logger.error('Error loading the pedido product lookup:', error);
          return [];
        });
    },
    [customerScope, companyScope],
  );

  // The plancha lookup is unscoped by design (brief AC-12 lists only cliente
  // / producto for conversion): it stays a plain, eagerly-loaded
  // select exactly as it was.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (itemType !== 'sheet') {
        setSheetOptions([]);
        return;
      }
      try {
        const page = await paperSheetsApi.getPaperSheets({
          limit: 100,
          ...companyScope(),
        });
        if (!cancelled) {
          setSheetOptions(
            page.data.map((sheet) => ({
              uuid: sheet.uuid,
              label: `${sheet.code} - ${sheet.name ?? ''}`.trim(),
            })),
          );
        }
      } catch (error) {
        logger.error('Error loading the pedido plancha lookup:', error);
        if (!cancelled) setSheetOptions([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [itemType, companyScope]);

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

  const handleCustomerChange = (next: FilterOption | undefined) => {
    setCustomerOption(next);
    setProductOption(undefined);
    emit({ customerUuid: next?.value, productUuid: undefined });
  };

  /** Selecting a type clears the other uuid — at most one is ever sent. */
  const selectItemType = (next: ItemType) => {
    setItemType(next);
    setProductOption(undefined);
    emit({
      productUuid: undefined,
      sheetSupplyUuid: undefined,
    });
  };

  const topDefs: FilterDef[] = [
    {
      kind: 'entity',
      key: 'customerUuid',
      label: t('salesOrders.filters.customer'),
      placeholder: t('salesOrders.filters.customerPlaceholder'),
      loadOptions: loadCustomerOptions,
      testId: 'filter-customer',
      className: 'w-full sm:w-64',
    },
    {
      kind: 'date',
      key: 'deliveryDateFrom',
      label: t('salesOrders.filters.deliveryDateFrom'),
      testId: 'filter-delivery-from',
      className: 'w-full sm:w-48',
    },
    {
      kind: 'date',
      key: 'deliveryDateTo',
      label: t('salesOrders.filters.deliveryDateTo'),
      testId: 'filter-delivery-to',
      className: 'w-full sm:w-48',
    },
  ];

  const itemDef: FilterDef =
    itemType === 'product'
      ? {
          kind: 'entity',
          key: 'productUuid',
          label: '',
          placeholder: t('salesOrders.filters.allItems'),
          loadOptions: loadProductOptions,
          testId: 'filter-item',
          className: 'w-72',
        }
      : itemType === 'sheet'
        ? {
            kind: 'select',
            key: 'sheetSupplyUuid',
            label: '',
            placeholder: t('salesOrders.filters.allItems'),
            options: sheetOptions.map((option) => ({ value: option.uuid, label: option.label })),
            testId: 'filter-item',
            className: 'w-72',
          }
        : {
            kind: 'select',
            key: 'itemUuid',
            label: '',
            placeholder: t('salesOrders.filters.allItems'),
            options: [],
            disabled: true,
            testId: 'filter-item',
            className: 'w-72',
          };

  const itemValue: unknown =
    itemDef.key === 'productUuid' ? productOption : value.sheetSupplyUuid;

  const handleTopChange = (key: string, next: unknown) => {
    if (key === 'customerUuid') return handleCustomerChange(next as FilterOption | undefined);
    if (key === 'deliveryDateFrom') return emit({ deliveryDateFrom: next as string });
    if (key === 'deliveryDateTo') return emit({ deliveryDateTo: next as string });
  };

  const handleItemChange = (key: string, next: unknown) => {
    if (key === 'productUuid') {
      setProductOption(next as FilterOption | undefined);
      return emit({ productUuid: (next as FilterOption | undefined)?.value });
    }
    if (key === 'sheetSupplyUuid') return emit({ sheetSupplyUuid: (next as string) || undefined });
  };

  const handleClear = () => {
    setItemType('');
    setSheetOptions([]);
    setCustomerOption(undefined);
    setProductOption(undefined);
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
        <FilterBar defs={topDefs} values={{ ...value, customerUuid: customerOption }} onChange={handleTopChange} />
      </div>

      {/* Row 2 — the exclusive producto / plancha pair */}
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
        <FilterBar defs={[itemDef]} values={{ [itemDef.key]: itemValue }} onChange={handleItemChange} />
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
