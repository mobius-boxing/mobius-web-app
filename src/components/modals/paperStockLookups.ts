import { useMemo, useRef } from 'react';
import { manufacturersApi, suppliersApi, warehousesApi, paperSuppliesApi } from '../../services/api';
import { FilterOption } from '../ui/filters';
import { Manufacturer, PaperSupply, Supplier, Warehouse } from '../../types';

const LOOKUP_LIMIT = 20;

export const manufacturerOption = (m: Manufacturer): FilterOption => ({ value: m.uuid, label: m.name });
export const supplierOption = (s: Supplier): FilterOption => ({ value: s.uuid, label: s.code });
export const warehouseOption = (w: Warehouse): FilterOption => ({ value: w.uuid, label: w.name });
export const paperSupplyOption = (p: PaperSupply): FilterOption => ({
  value: p.uuid,
  label: `${p.code} - ${p.name}`,
});

export function usePaperStockLookups(companyId: string | undefined) {
  const warehouses = useRef(new Map<string, Warehouse>());

  const loaders = useMemo(() => {
    const params = (search: string) => ({ search, limit: LOOKUP_LIMIT, ...(companyId ? { companyId } : {}) });
    return {
      manufacturer: (search: string) =>
        manufacturersApi.getManufacturers(params(search)).then((p) => p.data.map(manufacturerOption)),
      supplier: (search: string) =>
        suppliersApi.getSuppliers(params(search)).then((p) => p.data.map(supplierOption)),
      warehouse: (search: string) =>
        warehousesApi.getWarehouses(params(search)).then((p) => {
          p.data.forEach((w) => warehouses.current.set(w.uuid, w));
          return p.data.map(warehouseOption);
        }),
      paperSupply: (search: string) =>
        paperSuppliesApi.getPaperSupplies(params(search)).then((p) => p.data.map(paperSupplyOption)),
    };
  }, [companyId]);

  return { loaders, warehouses: warehouses.current };
}
