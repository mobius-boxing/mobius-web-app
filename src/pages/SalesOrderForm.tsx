import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import {
  Customer,
  DeliveryLocationRecord,
  Part,
  Product,
  SalesOrder,
  SalesOrderFormPayload,
  User,
} from '../types';
import {
  customersApi,
  deliveryLocationsApi,
  partsApi,
  productsApi,
  salesOrdersApi,
  usersApi,
} from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { usePermissions } from '../hooks/usePermissions';
import Layout from '../components/layout/Layout';
import SalesOrderApprovalControl from '../components/sales-orders/SalesOrderApprovalControl';
import SalesOrderLifecycleControl from '../components/sales-orders/SalesOrderLifecycleControl';
import SalesOrderProductionOrders from '../components/production-orders/SalesOrderProductionOrders';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { logger } from '../utils/logger';
import { formatMoney } from '../utils/money';

const DROPDOWN_LIMIT = 100;

/**
 * The pedido subtype. Procusto's "Agregar" dropdown has three buttons
 * (`PedidosForm.cs:500-524`); `PedidoDePlancha` is out of scope, so the form
 * offers the two the API accepts.
 */
type OrderType = 'product' | 'part';

interface SalesOrderFormValues {
  customerUuid: string;
  productUuid: string;
  partUuid: string;
  quantity: string;
  deliveryLocationUuid: string;
  salesUserUuid: string;
  deliveryDate: string;
  purchaseOrder: string;
  supplierCode: string;
  price: string;
  paid: string;
  salesSector: string;
  needsAdvanceInvoice: boolean;
  invoiceSent: boolean;
  notes: string;
  dispatchNotes: string;
  conversionNotes: string;
}

const EMPTY_VALUES: SalesOrderFormValues = {
  customerUuid: '',
  productUuid: '',
  partUuid: '',
  quantity: '',
  deliveryLocationUuid: '',
  salesUserUuid: '',
  deliveryDate: '',
  purchaseOrder: '',
  supplierCode: '',
  price: '',
  paid: '',
  salesSector: '',
  needsAdvanceInvoice: false,
  invoiceSent: false,
  notes: '',
  dispatchNotes: '',
  conversionNotes: '',
};

/** '' → undefined so an untouched optional field is never sent as a value. */
const optionalText = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim();

const optionalNumber = (value: string): number | undefined =>
  value.trim() === '' ? undefined : Number(value);

const userLabel = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

/**
 * "Alta de Pedido" — create and edit, one full-page form (15 fields do not fit
 * this app's 3-6-field modal pattern).
 *
 * DIVERGENCE D-1: the cliente is picked FIRST and the producto dropdown is
 * filtered to that cliente, inverting Procusto's product-first flow
 * (PedidoDeProductoForm.cs:176-199). The pairing is still enforced server-side.
 *
 * The Aprobaciones block is mounted (edit mode only) by the approvals feature;
 * cumplimiento and anulación remain separate features whose columns this page
 * only reads.
 */
const SalesOrderForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const isEdit = Boolean(uuid);
  const { effectiveCompanyId } = useEffectiveCompany();
  const { has } = usePermissions();

  const canEditPrices = has('orders.edit-prices');
  const canViewSalesSector = has('orders.view-sales-sector');

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('product');
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    unregister,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<SalesOrderFormValues>({ defaultValues: EMPTY_VALUES });

  const customerUuid = watch('customerUuid');
  const partUuid = watch('partUuid');
  const quantity = watch('quantity');
  const price = watch('price');

  /** Parte path: everything below the parte is derived, never chosen. */
  const isPartOrder = orderType === 'part';
  const selectedPart = parts.find((part) => part.uuid === partUuid) ?? null;

  /** The customer whose dependent lists are currently loaded. */
  const loadedForCustomer = useRef<string>('');

  const companyParams = useCallback(
    () => (effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    [effectiveCompanyId],
  );

  /**
   * Fetch the cliente-dependent dropdowns. Callers await this BEFORE reset()
   * so the select options exist when their values are applied (the guide's
   * dropdown-race rule).
   */
  const loadCustomerScopedLists = useCallback(
    async (customer: string) => {
      loadedForCustomer.current = customer;
      if (!customer) {
        setProducts([]);
        setDeliveryLocations([]);
        return;
      }
      try {
        const [productPage, locationPage] = await Promise.all([
          productsApi.getProducts({
            ...companyParams(),
            customerUuid: customer,
            limit: DROPDOWN_LIMIT,
          }),
          deliveryLocationsApi.getDeliveryLocations({
            ...companyParams(),
            customerUuid: customer,
            limit: DROPDOWN_LIMIT,
          }),
        ]);
        setProducts(productPage.data || []);
        setDeliveryLocations(locationPage.data || []);
      } catch (err: any) {
        logger.error('Error loading customer-scoped dropdowns:', err);
        setProducts([]);
        setDeliveryLocations([]);
      }
    },
    [companyParams],
  );

  /**
   * Parte path: the lookup spans EVERY parte of the company, not the partes of
   * one producto (`PedidoDeParteForm.cs:79-80`, `UIFilterParte(null, ...)`).
   */
  useEffect(() => {
    if (isEdit || !isPartOrder) return;
    let cancelled = false;
    const load = async () => {
      try {
        const partPage = await partsApi.getParts({
          ...companyParams(),
          limit: DROPDOWN_LIMIT,
        });
        if (!cancelled) setParts(partPage.data || []);
      } catch (err: any) {
        logger.error('Error loading parts dropdown:', err);
        if (!cancelled) setParts([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, isPartOrder, companyParams]);

  // Company-wide dropdowns (cliente + vendedor).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [customerPage, userPage] = await Promise.all([
          customersApi.getCustomers({ ...companyParams(), limit: DROPDOWN_LIMIT }),
          usersApi.getUsers({ ...companyParams(), limit: DROPDOWN_LIMIT }),
        ]);
        if (cancelled) return;
        setCustomers(customerPage.data || []);
        setUsers(userPage.data || []);
      } catch (err: any) {
        logger.error('Error loading sales order dropdowns:', err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [companyParams]);

  // Edit mode: load the order, then its dropdowns, then apply the values.
  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await salesOrdersApi.getSalesOrder(uuid);
        if (cancelled) return;
        setOrder(loaded);
        setOrderType(loaded.product ? 'product' : 'part');
        const customer = loaded.customer?.uuid ?? '';
        await loadCustomerScopedLists(customer);
        if (cancelled) return;
        reset({
          ...EMPTY_VALUES,
          customerUuid: customer,
          productUuid: loaded.product?.uuid ?? '',
          quantity: String(loaded.quantity ?? ''),
          deliveryLocationUuid: loaded.orderData?.deliveryLocation?.uuid ?? '',
          salesUserUuid: loaded.salesUser?.uuid ?? '',
          deliveryDate: loaded.deliveryDate ? loaded.deliveryDate.slice(0, 10) : '',
          purchaseOrder: loaded.purchaseOrder ?? '',
          supplierCode: loaded.supplierCode ?? '',
          price: loaded.price != null ? String(loaded.price) : '',
          paid: loaded.paid != null ? String(loaded.paid) : '',
          salesSector: loaded.salesSector ?? '',
          needsAdvanceInvoice: Boolean(loaded.needsAdvanceInvoice),
          invoiceSent: Boolean(loaded.invoiceSent),
          notes: loaded.orderData?.notes ?? '',
          dispatchNotes: loaded.orderData?.dispatchNotes ?? '',
          conversionNotes: loaded.orderData?.conversionNotes ?? '',
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || t('salesOrders.loadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  /**
   * Changing the cliente clears producto, lugar de entrega and vendedor and
   * refetches both lists — the Procusto refresh chain
   * (PedidoDeProductoForm.cs:176-199), inverted.
   */
  useEffect(() => {
    if (customerUuid === loadedForCustomer.current) return;
    const hadPrevious = loadedForCustomer.current !== '';
    if (hadPrevious) {
      setValue('productUuid', '');
      setValue('deliveryLocationUuid', '');
      setValue('salesUserUuid', '');
    }
    loadCustomerScopedLists(customerUuid);
  }, [customerUuid, loadCustomerScopedLists, setValue]);

  /**
   * `PedidoDeParteForm.cs:142-153`: choosing a parte fills the read-only
   * cliente and producto boxes from `Parte.Producto.Cliente` / `Parte.Producto`.
   * Writing the derived cliente into the form is also what refetches the
   * cliente-scoped lugar-de-entrega list.
   */
  useEffect(() => {
    if (!isPartOrder || isEdit) return;
    const derived = selectedPart?.product?.customer?.uuid ?? '';
    if (derived !== customerUuid) setValue('customerUuid', derived);
  }, [isPartOrder, isEdit, selectedPart, customerUuid, setValue]);

  /**
   * Switching subtype starts a fresh pedido: the discriminator not in play is
   * unregistered so its `required` rule cannot block a submit from a control
   * the user can no longer see.
   */
  const changeOrderType = (next: OrderType) => {
    setOrderType(next);
    setValue('customerUuid', '');
    if (next === 'part') {
      setValue('productUuid', '');
      unregister('productUuid');
    } else {
      setValue('partUuid', '');
      unregister('partUuid');
      setParts([]);
    }
  };

  const quantityNumber = Number(quantity);
  const priceNumber = Number(price);
  const total =
    price.trim() !== '' && quantity.trim() !== '' &&
    !Number.isNaN(priceNumber) && !Number.isNaN(quantityNumber)
      ? priceNumber * quantityNumber
      : null;

  const buildPayload = (values: SalesOrderFormValues): SalesOrderFormPayload => {
    const payload: SalesOrderFormPayload = {
      quantity: Number(values.quantity),
      deliveryLocationUuid: values.deliveryLocationUuid || null,
      purchaseOrder: optionalText(values.purchaseOrder) ?? null,
      supplierCode: optionalText(values.supplierCode) ?? null,
      needsAdvanceInvoice: values.needsAdvanceInvoice,
      invoiceSent: values.invoiceSent,
      notes: optionalText(values.notes) ?? null,
      dispatchNotes: optionalText(values.dispatchNotes) ?? null,
      conversionNotes: optionalText(values.conversionNotes) ?? null,
    };
    if (!isEdit) {
      // Immutable on edit (PedidoDeProductoForm.cs:80) — the API 400s a change,
      // so the form never re-sends them. Exactly one discriminator travels; on
      // the parte path the cliente is derived by the API from
      // parte -> producto -> cliente (PedidoDeParteMapper.cs:19), so it is not
      // sent at all.
      if (isPartOrder) {
        payload.partUuid = values.partUuid;
      } else {
        payload.customerUuid = values.customerUuid;
        payload.productUuid = values.productUuid;
      }
    }
    // D-7: an ABSENT key is what makes the API fall back to the cliente's
    // vendedor (`customers.salesPersonId`); `null` means "explicitly nobody"
    // and would skip that default. On edit `null` keeps its meaning — it is
    // the only way to clear the vendedor.
    if (isEdit) {
      payload.salesUserUuid = values.salesUserUuid || null;
    } else if (values.salesUserUuid) {
      payload.salesUserUuid = values.salesUserUuid;
    }
    // `orders.edit-delivery-date` gates any CHANGE of the date, and this input
    // truncates the stored instant to its day: re-sending an untouched value
    // would 403 a caller without the code, or silently rewrite a time-bearing
    // timestamp to UTC midnight. Only a dirty field travels.
    if (dirtyFields.deliveryDate) {
      payload.deliveryDate = values.deliveryDate || null;
    }
    // Sending price/paid without orders.edit-prices is a 403; the fields are
    // read-only for those callers, so the keys are omitted entirely.
    if (canEditPrices) {
      const priceValue = optionalNumber(values.price);
      const paidValue = optionalNumber(values.paid);
      if (priceValue !== undefined) payload.price = priceValue;
      if (paidValue !== undefined) payload.paid = paidValue;
    }
    if (canViewSalesSector) {
      payload.salesSector = optionalText(values.salesSector) ?? null;
    }
    return payload;
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(values);
      const saved = uuid
        ? await salesOrdersApi.updateSalesOrder(uuid, payload)
        : await salesOrdersApi.createSalesOrder(payload);
      if (uuid) {
        setOrder(saved);
      } else {
        navigate(`/sales-orders/${saved.uuid}`);
      }
    } catch (err: any) {
      // Server 400/403 messages are surfaced, never swallowed.
      setError(err?.response?.data?.message || t('salesOrders.saveFailed'));
    } finally {
      setSaving(false);
    }
  });

  const selectClass = 'input-field';
  const labelClass = 'block text-sm font-medium text-secondary-700 mb-1.5';

  return (
    <Layout>
      <form
        className="space-y-6"
        onSubmit={onSubmit}
        data-testid="sales-order-form"
        noValidate
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/sales-orders')}
              data-testid="back-to-sales-orders-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="gd-page-title">
                {isEdit ? t('salesOrders.editTitle') : t('salesOrders.createTitle')}
              </h1>
              <p className="text-secondary-600">{t('salesOrders.formSubtitle')}</p>
            </div>
          </div>
          <Button type="submit" loading={saving} data-testid="submit-sales-order-btn">
            {t('common.save')}
          </Button>
        </div>

        <ErrorMessage message={error} />

        {/* Read-only header block: número / creación / cotización (D-11). */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className={labelClass}>{t('salesOrders.fields.number')}</span>
            <p className="text-sm text-secondary-900" data-testid="order-number">
              {order?.number ?? t('salesOrders.numberAssignedOnSave')}
            </p>
          </div>
          <div>
            <span className={labelClass}>{t('salesOrders.fields.createdAt')}</span>
            <p className="text-sm text-secondary-900">
              {order?.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <span className={labelClass}>{t('salesOrders.fields.quotation')}</span>
            <p className="text-sm text-secondary-500" data-testid="order-quotation">-</p>
          </div>
          <div>
            <span className={labelClass}>{t('salesOrders.fields.quotationDate')}</span>
            <p className="text-sm text-secondary-500" data-testid="order-quotation-date">-</p>
          </div>
          {isEdit && (
            <div>
              <span className={labelClass}>{t('salesOrders.fields.status')}</span>
              <p className="text-sm font-medium text-secondary-900" data-testid="order-status">
                {order?.status ? t(`salesOrders.status.${order.status}`) : '-'}
              </p>
            </div>
          )}
        </div>

        {/* Aprobaciones — edit mode only; the order must exist to be approved. */}
        {isEdit && order && (
          <SalesOrderApprovalControl order={order} onChanged={setOrder} />
        )}

        {/* Cumplimiento y anulación — the two pair machines the approvals
            block above deliberately does not own. */}
        {isEdit && order && (
          <SalesOrderLifecycleControl order={order} onChanged={setOrder} />
        )}

        {isEdit && order && <SalesOrderProductionOrders salesOrderUuid={order.uuid} commerciallyApproved={!!order.commerciallyApproved} financiallyApproved={!!order.financiallyApproved} savedAt={order.updatedAt} />}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 0. Tipo de pedido — the "Agregar" dropdown's two supported buttons
              (PedidosForm.cs:500-524). Create only: the subtype is immutable. */}
          {!isEdit && (
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="orderType">
                {t('salesOrders.fields.orderType')}
              </label>
              <select
                id="orderType"
                name="orderType"
                className={selectClass}
                data-testid="order-type-select"
                value={orderType}
                onChange={(event) => changeOrderType(event.target.value as OrderType)}
              >
                <option value="product">{t('salesOrders.orderTypes.product')}</option>
                <option value="part">{t('salesOrders.orderTypes.part')}</option>
              </select>
            </div>
          )}

          {/* 1. Cliente — chosen first on the producto path; DERIVED and
              read-only on the parte path (PedidoDeParteForm.cs:142-153). */}
          {isPartOrder && !isEdit ? (
            <div>
              <span className={labelClass}>{t('salesOrders.fields.customer')}</span>
              <p className="text-sm text-secondary-900" data-testid="derived-customer">
                {selectedPart?.product?.customer?.name ?? '-'}
              </p>
            </div>
          ) : (
          <div>
            <label className={labelClass} htmlFor="customerUuid">
              {t('salesOrders.fields.customer')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="customerUuid"
              className={selectClass}
              data-testid="customer-select"
              disabled={isEdit || loading}
              {...register('customerUuid', {
                // Immutable and disabled on edit, where it is never submitted;
                // a required rule on a disabled control would block the save.
                required: isEdit ? false : t('salesOrders.validation.customerRequired'),
              })}
            >
              <option value="">{t('salesOrders.placeholders.customer')}</option>
              {customers.map((customer) => (
                <option key={customer.uuid} value={customer.uuid}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customerUuid && (
              <p className="mt-1.5 text-sm text-red-600">{errors.customerUuid.message}</p>
            )}
          </div>
          )}

          {/* 2. Producto — disabled until a cliente is chosen (D-1) — or the
              parte lookup, over every parte of the company, with the producto
              it derives shown underneath. */}
          {isPartOrder ? (
            isEdit ? (
              <div>
                <span className={labelClass}>{t('salesOrders.fields.part')}</span>
                <p className="text-sm text-secondary-900" data-testid="order-item-description">
                  {order?.itemDescription || '-'}
                </p>
              </div>
            ) : (
              <div>
                <label className={labelClass} htmlFor="partUuid">
                  {t('salesOrders.fields.part')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="partUuid"
                  className={selectClass}
                  data-testid="part-select"
                  disabled={loading}
                  {...register('partUuid', {
                    required: t('salesOrders.validation.partRequired'),
                  })}
                >
                  <option value="">{t('salesOrders.placeholders.part')}</option>
                  {parts.map((part) => (
                    <option key={part.uuid} value={part.uuid}>
                      {part.code}
                      {part.description ? ` — ${part.description}` : ''}
                    </option>
                  ))}
                </select>
                {errors.partUuid && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.partUuid.message}</p>
                )}
                <p className="mt-1.5 text-sm text-secondary-600" data-testid="derived-product">
                  {t('salesOrders.fields.product')}:{' '}
                  {selectedPart?.product
                    ? [selectedPart.product.code, selectedPart.product.description]
                        .filter(Boolean)
                        .join(' — ')
                    : '-'}
                </p>
              </div>
            )
          ) : (
          <div>
            <label className={labelClass} htmlFor="productUuid">
              {t('salesOrders.fields.product')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="productUuid"
              className={selectClass}
              data-testid="product-select"
              disabled={isEdit || !customerUuid || loading}
              {...register('productUuid', {
                required: isEdit ? false : t('salesOrders.validation.productRequired'),
              })}
            >
              <option value="">
                {customerUuid
                  ? t('salesOrders.placeholders.product')
                  : t('salesOrders.placeholders.productNeedsCustomer')}
              </option>
              {products.map((product) => (
                <option key={product.uuid} value={product.uuid}>
                  {product.code}
                  {product.description ? ` — ${product.description}` : ''}
                </option>
              ))}
            </select>
            {errors.productUuid && (
              <p className="mt-1.5 text-sm text-red-600">{errors.productUuid.message}</p>
            )}
          </div>
          )}

          {/* 3. Cantidad */}
          <Input
            id="quantity"
            type="number"
            step="any"
            label={t('salesOrders.fields.quantity')}
            required
            data-testid="quantity-input"
            error={errors.quantity?.message}
            {...register('quantity', {
              required: t('salesOrders.validation.quantityRequired'),
              validate: (value) =>
                Number(value) > 0 || t('salesOrders.validation.quantityPositive'),
            })}
          />

          {/* 4. Lugar de entrega */}
          <div>
            <label className={labelClass} htmlFor="deliveryLocationUuid">
              {t('salesOrders.fields.deliveryLocation')}
            </label>
            <select
              id="deliveryLocationUuid"
              className={selectClass}
              data-testid="delivery-location-select"
              disabled={!customerUuid}
              {...register('deliveryLocationUuid')}
            >
              <option value="">{t('salesOrders.placeholders.deliveryLocation')}</option>
              {deliveryLocations.map((location) => (
                <option key={location.uuid} value={location.uuid}>
                  {location.address}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Vendedor — empty means "the cliente's vendedor" (D-7). */}
          <div>
            <label className={labelClass} htmlFor="salesUserUuid">
              {t('salesOrders.fields.salesUser')}
            </label>
            <select
              id="salesUserUuid"
              className={selectClass}
              data-testid="sales-user-select"
              {...register('salesUserUuid')}
            >
              <option value="">{t('salesOrders.placeholders.salesUser')}</option>
              {users.map((user) => (
                <option key={user.uuid} value={user.uuid}>
                  {userLabel(user)}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Fecha de entrega */}
          <Input
            id="deliveryDate"
            type="date"
            label={t('salesOrders.fields.deliveryDate')}
            data-testid="delivery-date-input"
            {...register('deliveryDate')}
          />

          {/* 7. Orden de compra / código proveedor */}
          <Input
            id="purchaseOrder"
            type="text"
            label={t('salesOrders.fields.purchaseOrder')}
            data-testid="purchase-order-input"
            {...register('purchaseOrder')}
          />
          <Input
            id="supplierCode"
            type="text"
            label={t('salesOrders.fields.supplierCode')}
            data-testid="supplier-code-input"
            {...register('supplierCode')}
          />

          {/* 8. Precio unitario + total + pagado */}
          <Input
            id="price"
            type="number"
            step="any"
            label={t('salesOrders.fields.price')}
            readOnly={!canEditPrices}
            data-testid="price-input"
            {...register('price')}
          />
          <div>
            <span className={labelClass}>{t('salesOrders.fields.priceTotal')}</span>
            <p className="text-sm text-secondary-900 py-2" data-testid="price-total">
              {formatMoney(total)}
            </p>
          </div>
          <Input
            id="paid"
            type="number"
            step="any"
            label={t('salesOrders.fields.paid')}
            readOnly={!canEditPrices}
            data-testid="paid-input"
            {...register('paid')}
          />

          {/* 9. Sector ventas — permission-gated (EdicionDatosPedido.cs:159-160) */}
          {canViewSalesSector && (
            <Input
              id="salesSector"
              type="text"
              label={t('salesOrders.fields.salesSector')}
              data-testid="sales-sector-input"
              {...register('salesSector')}
            />
          )}

          {/* 10. Facturación */}
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input
              id="needsAdvanceInvoice"
              type="checkbox"
              data-testid="needs-advance-invoice-input"
              {...register('needsAdvanceInvoice')}
            />
            {t('salesOrders.fields.needsAdvanceInvoice')}
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input
              id="invoiceSent"
              type="checkbox"
              data-testid="invoice-sent-input"
              {...register('invoiceSent')}
            />
            {t('salesOrders.fields.invoiceSent')}
          </label>
        </div>

        {/* 11. Observaciones — persisted on order_data */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="notes">
              {t('salesOrders.fields.notes')}
            </label>
            <textarea
              id="notes"
              className={selectClass}
              rows={3}
              data-testid="notes-input"
              {...register('notes')}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="conversionNotes">
              {t('salesOrders.fields.conversionNotes')}
            </label>
            <textarea
              id="conversionNotes"
              className={selectClass}
              rows={3}
              data-testid="conversion-notes-input"
              {...register('conversionNotes')}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="dispatchNotes">
              {t('salesOrders.fields.dispatchNotes')}
            </label>
            <textarea
              id="dispatchNotes"
              className={selectClass}
              rows={3}
              data-testid="dispatch-notes-input"
              {...register('dispatchNotes')}
            />
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default SalesOrderForm;
