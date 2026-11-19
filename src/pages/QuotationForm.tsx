import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, Check, Undo2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Skeleton } from '../components/ui/Skeleton';
import { EntityAutocomplete, FilterOption } from '../components/ui/filters';
import DeliveriesEditor, {
  DeliveryDraft,
  DeliveryLocationOption,
  deliveriesError,
  toDeliveryDrafts,
  toDeliveryInputs,
} from '../components/deliveries/DeliveriesEditor';
import { QuotationStatusChip } from './Quotations';
import { entityLoaders } from '../filters/entityLoaders';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { usePermissions } from '../hooks/usePermissions';
import { deliveryLocationsApi, productsApi, quotationsApi, usersApi } from '../services/api';
import {
  Product,
  QUOTATION_STATUSES,
  Quotation,
  QuotationGenerateResult,
  QuotationPayload,
  QuotationStatus,
  User,
} from '../types';
import { formatMoney } from '../utils/money';
import { logger } from '../utils/logger';

const DROPDOWN_LIMIT = 100;
const GUARD_SALES_ORDER_NOT_APPROVED = 'SALES_ORDER_NOT_APPROVED';

interface QuotationFormValues {
  customerUuid: string;
  productUuid: string;
  quantity: string;
  price: string;
  status: QuotationStatus;
  deliveryDate: string;
  salesUserUuid: string;
  notes: string;
}

const EMPTY_VALUES: QuotationFormValues = {
  customerUuid: '',
  productUuid: '',
  quantity: '',
  price: '',
  status: 'draft',
  deliveryDate: '',
  salesUserUuid: '',
  notes: '',
};

const userLabel = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

const toValues = (q: Quotation): QuotationFormValues => ({
  customerUuid: q.customer.uuid,
  productUuid: q.product.uuid,
  quantity: String(q.quantity),
  price: String(q.price),
  status: q.status,
  deliveryDate: q.deliveryDate ? q.deliveryDate.slice(0, 10) : '',
  salesUserUuid: q.salesUser?.uuid ?? '',
  notes: q.notes ?? '',
});

/**
 * Cotización — create and edit on one page. Quantity and price are required
 * (card 1). A quotation that already generated its pedido is read-only except
 * for the "Generar orden de producción" retry (D-57); an approved one is
 * read-only except its status (API 409 QUOTATION_APPROVED, Corrunor
 * `NoEditarAprobados`).
 */
const QuotationForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const isEdit = Boolean(uuid);
  const { effectiveCompanyId } = useEffectiveCompany();
  const { has } = usePermissions();
  const canApprove = has('quotations.approve');
  const canGenerate = has('orders.edit');

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customerOption, setCustomerOption] = useState<FilterOption>();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<QuotationGenerateResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryDraft[]>([]);
  const [deliveriesDirty, setDeliveriesDirty] = useState(false);
  const [locations, setLocations] = useState<DeliveryLocationOption[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuotationFormValues>({ defaultValues: EMPTY_VALUES, mode: 'onBlur' });

  const customerUuid = watch('customerUuid');
  const quantity = watch('quantity');
  const price = watch('price');
  const approvedLocked = Boolean(quotation?.approved && !quotation?.ordered);
  const readOnly = Boolean(quotation?.ordered) || approvedLocked;

  const companyParams = useCallback(
    () => (effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    [effectiveCompanyId],
  );

  const loadCustomerOptions = useMemo(
    () => entityLoaders.customer(effectiveCompanyId ?? undefined),
    [effectiveCompanyId],
  );

  const loadProducts = useCallback(
    async (customer: string) => {
      if (!customer) {
        setProducts([]);
        return [];
      }
      try {
        const page = await productsApi.getProducts({ ...companyParams(), customerUuid: customer, limit: DROPDOWN_LIMIT });
        setProducts(page.data || []);
        return page.data || [];
      } catch (err) {
        logger.error('Error loading customer products:', err);
        setProducts([]);
        return [];
      }
    },
    [companyParams],
  );

  useEffect(() => {
    let cancelled = false;
    usersApi
      .getUsers({ ...companyParams(), limit: DROPDOWN_LIMIT })
      .then((page) => {
        if (!cancelled) setUsers(page.data || []);
      })
      .catch((err) => logger.error('Error loading quotation sales users:', err));
    return () => {
      cancelled = true;
    };
  }, [companyParams]);

  useEffect(() => {
    if (!customerUuid) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    deliveryLocationsApi
      .getDeliveryLocations({ ...companyParams(), customerUuid, limit: DROPDOWN_LIMIT })
      .then((page) => {
        if (!cancelled) setLocations((page.data || []).map((l) => ({ uuid: l.uuid, address: l.address })));
      })
      .catch((err) => {
        logger.error('Error loading delivery locations:', err);
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customerUuid, companyParams]);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await quotationsApi.getQuotation(uuid);
        if (cancelled) return;
        await loadProducts(loaded.customer.uuid);
        if (cancelled) return;
        setQuotation(loaded);
        setCustomerOption({ value: loaded.customer.uuid, label: loaded.customer.name });
        reset(toValues(loaded));
        setDeliveries(toDeliveryDrafts(loaded.deliveries));
        setDeliveriesDirty(false);
      } catch (err: any) {
        logger.error('Error loading quotation:', err);
        if (!cancelled) setError(err?.response?.data?.message || t('quotations.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [uuid, loadProducts, reset, t]);

  const total = useMemo(() => {
    const q = Number(quantity);
    const p = Number(price);
    return quantity !== '' && price !== '' && Number.isFinite(q) && Number.isFinite(p) ? q * p : null;
  }, [quantity, price]);

  const save = async (values: QuotationFormValues) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const problem = approvedLocked ? null : deliveriesError(deliveries);
      if (problem) {
        setError(t(`deliveries.error.${problem}`));
        return;
      }
      const payload: QuotationPayload = approvedLocked
        ? { status: values.status }
        : {
            quantity: Number(values.quantity),
            price: Number(values.price),
            status: values.status,
            deliveryDate: values.deliveryDate ? `${values.deliveryDate}T00:00:00.000Z` : null,
            notes: values.notes.trim() || null,
          };
      if (!approvedLocked && (deliveriesDirty || (!isEdit && deliveries.length > 0))) {
        payload.deliveries = toDeliveryInputs(deliveries);
      }
      if (!approvedLocked) {
        if (!isEdit) {
          payload.customerUuid = values.customerUuid;
          payload.productUuid = values.productUuid;
          if (values.salesUserUuid) payload.salesUserUuid = values.salesUserUuid;
        } else {
          payload.salesUserUuid = values.salesUserUuid || null;
        }
      }
      if (uuid) {
        const saved = await quotationsApi.updateQuotation(uuid, payload);
        setQuotation(saved);
        reset(toValues(saved));
        setDeliveries(toDeliveryDrafts(saved.deliveries));
        setDeliveriesDirty(false);
        setNotice(t('quotations.saved'));
      } else {
        const saved = await quotationsApi.createQuotation(payload);
        navigate(`/quotations/${saved.uuid}`);
      }
    } catch (err: any) {
      logger.error('Error saving quotation:', err);
      setError(err?.response?.data?.message || t('quotations.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Approved quotes only change status: their disabled required inputs would fail validation, so skip it.
  const onSubmit = approvedLocked
    ? (event: React.FormEvent) => {
        event.preventDefault();
        return save(getValues());
      }
    : handleSubmit(save);

  const toggleApproval = async () => {
    if (!quotation) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await quotationsApi.setApproval(quotation.uuid, !quotation.approved);
      setQuotation(updated);
    } catch (err: any) {
      logger.error('Error changing quotation approval:', err);
      setError(err?.response?.data?.message || t('quotations.approvalFailed'));
    }
  };

  /** First call creates the pedido; once it is approved, the same call creates the production orders (D-27, D-57). */
  const generateOrder = async () => {
    if (!quotation) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await quotationsApi.generateOrder(quotation.uuid);
      setQuotation(result.quotation);
      setGenerateResult(result);
    } catch (err: any) {
      logger.error('Error generating order from quotation:', err);
      setGenerateError(err?.response?.data?.message || t('quotations.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-secondary-700 mb-1.5';
  const selectClass = 'input-field';
  const salesOrder = generateResult?.salesOrder ?? quotation?.salesOrder ?? null;
  const warnings = generateResult?.warnings ?? [];
  const needsApproval = warnings.some((w) => w.startsWith(GUARD_SALES_ORDER_NOT_APPROVED));
  const productionOrders = generateResult?.productionOrders ?? [];
  const canStartGeneration = Boolean(quotation && quotation.status !== 'rejected' && !quotation.ordered);

  return (
    <Layout>
      <form className="space-y-6" onSubmit={onSubmit} noValidate data-testid="quotation-form">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')} data-testid="back-to-quotations-btn">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('quotations.back')}
            </Button>
            <h1 className="gd-page-title">
              {isEdit && quotation ? t('quotations.editTitle', { number: quotation.number }) : t('quotations.createTitle')}
            </h1>
            {quotation && <QuotationStatusChip status={quotation.status} />}
          </div>
          {!quotation?.ordered && (
            <Button type="submit" loading={saving} disabled={saving || loading} data-testid="save-quotation-btn">
              {t('common.save')}
            </Button>
          )}
        </div>

        <ErrorMessage message={error} />
        {notice && <p className="text-sm text-green-700" data-testid="quotation-notice">{notice}</p>}

        {loading ? (
          <Skeleton lines={8} data-testid="quotation-form-loading" />
        ) : (
          <>
            {quotation && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-secondary-200 bg-white p-4 shadow-sm" data-testid="quotation-approval-block">
                <span className="text-sm text-secondary-700">
                  {t('quotations.fields.approval')}:{' '}
                  <strong data-testid="quotation-approval-state">
                    {quotation.approved ? t('quotations.approved') : t('quotations.pending')}
                  </strong>
                  {quotation.approved && quotation.approvedByUser ? ` · ${quotation.approvedByUser}` : ''}
                </span>
                {canApprove && !quotation.ordered && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleApproval}
                    disabled={saving}
                    data-testid="quotation-toggle-approval-btn"
                  >
                    {quotation.approved ? <Undo2 className="mr-1 h-4 w-4" /> : <Check className="mr-1 h-4 w-4" />}
                    {quotation.approved ? t('quotations.unapprove') : t('quotations.approve')}
                  </Button>
                )}
                {canGenerate && canStartGeneration && (
                  <Button size="sm" onClick={generateOrder} loading={generating} disabled={generating} data-testid="generate-order-btn">
                    {t('quotations.generateOrder')}
                  </Button>
                )}
              </div>
            )}

            {(salesOrder || generateError) && (
              <div className="space-y-3 rounded-lg border border-secondary-200 bg-white p-4 shadow-sm" data-testid="quotation-generation-panel">
                {salesOrder && (
                  <p className="text-sm text-secondary-800">
                    {t('quotations.generation.salesOrder')}:{' '}
                    <Link to={`/sales-orders/${salesOrder.uuid}`} className="font-medium text-primary-600 hover:underline" data-testid="generated-sales-order-link">
                      {salesOrder.number}
                    </Link>
                  </p>
                )}
                {generateError && <ErrorMessage message={generateError} />}
                {warnings.length > 0 && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" data-testid="generation-warning" role="alert">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      {t('quotations.generation.warningTitle')}
                    </div>
                    <ul className="list-disc space-y-1 pl-5">
                      {warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                    {needsApproval && <p className="mt-2">{t('quotations.generation.approveHint')}</p>}
                  </div>
                )}
                {productionOrders.length > 0 && (
                  <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" data-testid="generation-production-orders">
                    <p className="mb-1 font-medium">{t('quotations.generation.productionOrders')}</p>
                    <ul className="list-disc pl-5">
                      {productionOrders.map((po) => (
                        <li key={po.uuid}>{po.number}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {quotation?.ordered && canGenerate && productionOrders.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateOrder}
                    loading={generating}
                    disabled={generating}
                    data-testid="retry-generate-btn"
                  >
                    {t('quotations.generation.retry')}
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 rounded-lg border border-secondary-200 bg-white p-6 shadow-sm md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="customerUuid">
                  {t('quotations.fields.customer')}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="hidden"
                  {...register('customerUuid', { required: t('quotations.validation.customerRequired') })}
                />
                <EntityAutocomplete
                  id="customerUuid"
                  data-testid="customer-select"
                  disabled={isEdit}
                  value={customerOption}
                  onChange={(next) => {
                    setCustomerOption(next);
                    setValue('customerUuid', next?.value ?? '', { shouldDirty: true, shouldValidate: true });
                    setValue('productUuid', '');
                    loadProducts(next?.value ?? '');
                  }}
                  loadOptions={loadCustomerOptions}
                  placeholder={t('quotations.placeholders.customer')}
                />
                {errors.customerUuid && <p className="mt-1.5 text-sm text-red-600">{errors.customerUuid.message}</p>}
              </div>

              <div>
                <label className={labelClass} htmlFor="productUuid">
                  {t('quotations.fields.product')}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  id="productUuid"
                  className={selectClass}
                  data-testid="product-select"
                  disabled={isEdit || !customerUuid}
                  {...register('productUuid', { required: t('quotations.validation.productRequired') })}
                >
                  <option value="">
                    {customerUuid ? t('quotations.placeholders.product') : t('quotations.placeholders.productNeedsCustomer')}
                  </option>
                  {products.map((product) => (
                    <option key={product.uuid} value={product.uuid}>
                      {product.code}
                      {product.description ? ` — ${product.description}` : ''}
                    </option>
                  ))}
                </select>
                {errors.productUuid && <p className="mt-1.5 text-sm text-red-600">{errors.productUuid.message}</p>}
              </div>

              <Input
                id="quantity"
                type="number"
                step="any"
                label={t('quotations.fields.quantity')}
                required
                disabled={readOnly}
                data-testid="quantity-input"
                error={errors.quantity?.message}
                {...register('quantity', {
                  required: t('quotations.validation.quantityRequired'),
                  validate: (v) => Number(v) > 0 || t('quotations.validation.quantityPositive'),
                })}
              />

              <Input
                id="price"
                type="number"
                step="any"
                label={t('quotations.fields.price')}
                required
                disabled={readOnly}
                data-testid="price-input"
                error={errors.price?.message}
                {...register('price', {
                  required: t('quotations.validation.priceRequired'),
                  validate: (v) => Number(v) >= 0 || t('quotations.validation.priceNonNegative'),
                })}
              />

              <div>
                <span className={labelClass}>{t('quotations.fields.priceTotal')}</span>
                <p className="py-2 text-sm text-secondary-900" data-testid="price-total">
                  {formatMoney(total)}
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="status">
                  {t('quotations.fields.status')}
                </label>
                <select id="status" className={selectClass} disabled={Boolean(quotation?.ordered)} data-testid="status-select" {...register('status')}>
                  {QUOTATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`quotations.status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                id="deliveryDate"
                type="date"
                label={t('quotations.fields.deliveryDate')}
                disabled={readOnly}
                data-testid="delivery-date-input"
                {...register('deliveryDate')}
              />

              <div>
                <label className={labelClass} htmlFor="salesUserUuid">
                  {t('quotations.fields.salesUser')}
                </label>
                <select
                  id="salesUserUuid"
                  className={selectClass}
                  disabled={readOnly}
                  data-testid="sales-user-select"
                  {...register('salesUserUuid')}
                >
                  <option value="">{t('quotations.placeholders.salesUser')}</option>
                  {users.map((user) => (
                    <option key={user.uuid} value={user.uuid}>
                      {userLabel(user)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="notes">
                  {t('quotations.fields.notes')}
                </label>
                <textarea id="notes" className={selectClass} rows={3} disabled={readOnly} data-testid="notes-input" {...register('notes')} />
              </div>
            </div>

            <DeliveriesEditor
              rows={deliveries}
              onChange={(rows) => {
                setDeliveries(rows);
                setDeliveriesDirty(true);
              }}
              locations={locations}
              parentQuantity={quantity === '' ? NaN : Number(quantity)}
              disabled={readOnly}
            />

            {quotation?.ordered && <p className="text-sm text-secondary-500">{t('quotations.readOnlyNotice')}</p>}
            {approvedLocked && (
              <p className="text-sm text-amber-800" data-testid="quotation-approved-notice">
                {t('quotations.approvedReadOnlyNotice')}
              </p>
            )}
          </>
        )}
      </form>
    </Layout>
  );
};

export default QuotationForm;
