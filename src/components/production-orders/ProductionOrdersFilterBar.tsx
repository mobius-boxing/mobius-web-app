import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDef } from '../ui/filters';

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

/**
 * The órdenes de producción filter defs, rendered by the shared `FilterBar`.
 *
 * Every field here is a standalone select or date range — none depends on
 * another filter's value — so unlike the pedido bar this one needs no
 * bespoke wiring at all: `useEntityList`'s `filterBarProps` renders straight
 * through `<FilterBar>`.
 */
export const useProductionOrdersFilterDefs = (): FilterDef[] => {
  const { t } = useTranslation();

  return useMemo<FilterDef[]>(
    () => [
      {
        kind: 'text',
        key: 'search',
        label: t('productionOrders.filters.search'),
        placeholder: t('productionOrders.searchPlaceholder'),
        className: 'gd-filters-field',
      },
      ...SELECTS.map(
        (select): FilterDef => ({
          kind: 'select',
          key: select.key,
          label: t(select.labelKey),
          placeholder: t(select.allKey),
          className: 'gd-filters-field',
          testId: select.testId,
          options: select.options.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          })),
        }),
      ),
      {
        kind: 'date',
        key: 'deliveryDateFrom',
        label: t('productionOrders.filters.deliveryFrom'),
        className: 'gd-filters-field',
        testId: 'filter-delivery-from',
      },
      {
        kind: 'date',
        key: 'deliveryDateTo',
        label: t('productionOrders.filters.deliveryTo'),
        className: 'gd-filters-field',
        testId: 'filter-delivery-to',
      },
    ],
    [t],
  );
};

export default useProductionOrdersFilterDefs;
