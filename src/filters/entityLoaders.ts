import {
  boxTypesApi,
  colorTypesApi,
  companiesApi,
  complementsApi,
  consumableSuppliesApi,
  consumableTypesApi,
  corrugationClassesApi,
  corrugationsApi,
  customerCategoriesApi,
  customersApi,
  flapTypesApi,
  fluteTypesApi,
  machineTypesApi,
  manufacturersApi,
  palletTypesApi,
  paperClassesApi,
  paperSheetsApi,
  paperSuppliesApi,
  paperTypesApi,
  productTypesApi,
  productsApi,
  salesOrdersApi,
  suppliersApi,
  toolingTypesApi,
  toolingsApi,
  usersApi,
  warehousesApi,
} from '../services/api';
import { FilterOption } from '../components/ui/filters/types';

/**
 * Every joined-entity kind the registry (`columnFilters.json`) can name — the
 * full set from `column-filters/model.md`, not just the ones this track wires.
 */
export type EntityKind =
  | 'customer'
  | 'supplier'
  | 'manufacturer'
  | 'productType'
  | 'boxType'
  | 'colorType'
  | 'fluteType'
  | 'paperType'
  | 'paperClass'
  | 'consumableType'
  | 'toolingType'
  | 'machineType'
  | 'palletType'
  | 'corrugationClass'
  | 'customerCategory'
  | 'warehouse'
  | 'company'
  | 'user'
  | 'consumableSupply'
  | 'paperSupply'
  | 'paperSheet'
  | 'tooling'
  | 'flapType'
  | 'complement'
  | 'corrugation'
  | 'product'
  | 'salesOrder';

type Loader = (search: string) => Promise<FilterOption[]>;
type NamedEntity = { uuid: string; code?: string | null; name?: string | null; description?: string | null };

const entityLabel = ({ code, name, description }: NamedEntity): string =>
  code && name ? `${code} - ${name}` : name ?? description ?? code ?? '';

const namedLoader = <T extends NamedEntity>(
  fetch: (params: { search: string; limit: number; companyId?: string }) => Promise<{ data: T[] }>,
): ((companyId?: string) => Loader) =>
  (companyId) => (search) =>
    fetch({ search, limit: 20, ...(companyId ? { companyId } : {}) }).then((page) =>
      page.data.map((entity) => ({ value: entity.uuid, label: entityLabel(entity) })),
    );

const userLabel = (user: { firstName?: string; lastName?: string; email: string }): string => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
};

const IMPLEMENTED_LOADERS: Partial<Record<EntityKind, (companyId?: string) => Loader>> = {
  customer: (companyId) => (search) =>
    customersApi
      .getCustomers({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) => page.data.map((customer) => ({ value: customer.uuid, label: customer.name }))),

  productType: (companyId) => (search) =>
    productTypesApi
      .getProductTypes({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) =>
        page.data.map((productType) => ({
          value: productType.uuid,
          label: `${productType.code} - ${productType.name}`,
        })),
      ),

  boxType: (companyId) => (search) =>
    boxTypesApi
      .getBoxTypes({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) =>
        page.data.map((boxType) => ({
          value: boxType.uuid,
          label: `${boxType.code} - ${boxType.name}`,
        })),
      ),

  customerCategory: (companyId) => (search) =>
    customerCategoriesApi
      .getCategories({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) => page.data.map((category) => ({ value: category.uuid, label: category.name }))),

  user: (companyId) => (search) =>
    usersApi
      .getUsers({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) => page.data.map((user) => ({ value: user.uuid, label: userLabel(user) }))),

  product: (companyId) => (search) =>
    productsApi
      .getProducts({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) =>
        page.data.map((product) => ({
          value: product.uuid,
          label: `${product.code} - ${product.description ?? ''}`.trim(),
        })),
      ),

  salesOrder: (companyId) => (search) =>
    salesOrdersApi
      .getSalesOrders({ search, limit: 20, ...(companyId ? { companyId } : {}) })
      .then((page) => page.data.map((order) => ({ value: order.uuid, label: order.number }))),

  supplier: namedLoader((params) => suppliersApi.getSuppliers(params)),
  manufacturer: namedLoader((params) => manufacturersApi.getManufacturers(params)),
  colorType: namedLoader((params) => colorTypesApi.getColorTypes(params)),
  fluteType: namedLoader((params) => fluteTypesApi.getFluteTypes(params)),
  paperType: namedLoader((params) => paperTypesApi.getPaperTypes(params)),
  paperClass: namedLoader((params) => paperClassesApi.getPaperClasses(params)),
  consumableType: namedLoader((params) => consumableTypesApi.getConsumableTypes(params)),
  toolingType: namedLoader((params) => toolingTypesApi.getToolingTypes(params)),
  machineType: namedLoader((params) => machineTypesApi.getMachineTypes(params)),
  palletType: namedLoader((params) => palletTypesApi.getPalletTypes(params)),
  corrugationClass: namedLoader((params) => corrugationClassesApi.getCorrugationClasses(params)),
  warehouse: namedLoader((params) => warehousesApi.getWarehouses(params)),
  company: namedLoader((params) => companiesApi.getCompanies(params)),
  consumableSupply: namedLoader((params) => consumableSuppliesApi.getConsumableSupplies(params)),
  paperSupply: namedLoader((params) => paperSuppliesApi.getPaperSupplies(params)),
  paperSheet: namedLoader((params) => paperSheetsApi.getPaperSheets(params)),
  tooling: namedLoader((params) => toolingsApi.getToolings(params)),
  flapType: namedLoader((params) => flapTypesApi.getFlapTypes(params)),
  complement: namedLoader((params) => complementsApi.getComplements(params)),
  corrugation: namedLoader((params) => corrugationsApi.getCorrugations(params)),
};

/**
 * `columnFilterDefs` calls `entityLoaders[entity](companyId)` for every
 * `kind: 'entity'` registry row. A kind without an API client fails loudly
 * rather than showing an always-empty autocomplete in production.
 */
export const entityLoaders: Record<EntityKind, (companyId?: string) => Loader> = new Proxy(
  IMPLEMENTED_LOADERS as Record<EntityKind, (companyId?: string) => Loader>,
  {
    get(target, kind: string) {
      const loader = (target as Record<string, (companyId?: string) => Loader>)[kind];
      if (!loader) {
        throw new Error(`entityLoaders: loader not implemented for entity kind "${kind}"`);
      }
      return loader;
    },
  },
);
