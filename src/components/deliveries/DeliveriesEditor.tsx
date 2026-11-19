import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import { DeliveryAmountType, DeliveryInput, OrderDelivery } from '../../types';

export interface DeliveryDraft {
  key: string;
  deliveryDate: string;
  deliveryLocationUuid: string;
  /** Shown when the stored destination is not among the customer's loaded locations. */
  deliveryLocationLabel?: string;
  amountType: DeliveryAmountType;
  amount: string;
}

export interface DeliveryLocationOption {
  uuid: string;
  address?: string;
}

/** Same tolerance the API uses for `deliveriesMatch`. */
const MATCH_EPSILON = 1e-9;

let draftCounter = 0;
const nextKey = (): string => `delivery-${(draftCounter += 1)}`;

export const emptyDeliveryDraft = (): DeliveryDraft => ({
  key: nextKey(),
  deliveryDate: '',
  deliveryLocationUuid: '',
  amountType: 'quantity',
  amount: '',
});

export const toDeliveryDrafts = (deliveries: OrderDelivery[] | undefined): DeliveryDraft[] =>
  (deliveries ?? []).map((d) => ({
    key: nextKey(),
    deliveryDate: d.deliveryDate ? d.deliveryDate.slice(0, 10) : '',
    deliveryLocationUuid: d.deliveryLocation?.uuid ?? '',
    deliveryLocationLabel: d.deliveryLocation?.address ?? undefined,
    amountType: d.amountType,
    amount: String(d.amount),
  }));

export const toDeliveryInputs = (drafts: DeliveryDraft[]): DeliveryInput[] =>
  drafts.map((d) => ({
    deliveryDate: `${d.deliveryDate}T00:00:00.000Z`,
    deliveryLocationUuid: d.deliveryLocationUuid || null,
    amountType: d.amountType,
    amount: Number(d.amount),
  }));

/** Client-side first check; the API stays the authority (400 messages are surfaced by the form). */
export const deliveriesError = (drafts: DeliveryDraft[]): 'incomplete' | 'percentage' | null => {
  for (const d of drafts) {
    const amount = Number(d.amount);
    if (!d.deliveryDate || d.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) return 'incomplete';
    if (d.amountType === 'percentage' && amount > 100) return 'percentage';
  }
  return null;
};

const resolveQuantity = (draft: DeliveryDraft, parentQuantity: number): number | null => {
  const amount = Number(draft.amount);
  if (draft.amount.trim() === '' || !Number.isFinite(amount)) return null;
  if (draft.amountType === 'quantity') return amount;
  return Number.isFinite(parentQuantity) ? (parentQuantity * amount) / 100 : null;
};

interface DeliveriesEditorProps {
  rows: DeliveryDraft[];
  onChange: (rows: DeliveryDraft[]) => void;
  /** The customer's delivery locations; empty until a customer is chosen. */
  locations: DeliveryLocationOption[];
  /** Parent quantity the percentages resolve against and the total is compared to. */
  parentQuantity: number;
  disabled?: boolean;
}

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Math.round(value * 1e6) / 1e6);

/**
 * Entregas — shared by Cotización and Pedido. Percentages resolve against the
 * parent quantity as it is typed; a total that differs from it is a warning
 * only (the API accepts it, Procusto parity P8).
 */
const DeliveriesEditor: React.FC<DeliveriesEditorProps> = ({ rows, onChange, locations, parentQuantity, disabled }) => {
  const { t } = useTranslation();

  const update = (key: string, patch: Partial<DeliveryDraft>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const resolved = rows.map((row) => resolveQuantity(row, parentQuantity));
  const total = resolved.reduce<number>((sum, q) => sum + (q ?? 0), 0);
  const mismatch = rows.length > 0 && Number.isFinite(parentQuantity) && Math.abs(total - parentQuantity) >= MATCH_EPSILON;
  const toggleBase = 'px-2 py-1 text-xs font-medium border first:rounded-l-md last:rounded-r-md';

  return (
    <div className="space-y-3 rounded-lg border border-secondary-200 bg-white p-6 shadow-sm" data-testid="deliveries-editor">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-secondary-800">{t('deliveries.title')}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...rows, emptyDeliveryDraft()])}
          data-testid="add-delivery-btn"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('deliveries.add')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-secondary-500">{t('deliveries.empty')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const quantity = resolved[index];
            const knownLocation = locations.some((l) => l.uuid === row.deliveryLocationUuid);
            return (
              <div key={row.key} className="grid grid-cols-1 items-end gap-2 md:grid-cols-12" data-testid={`delivery-row-${index}`}>
                <div className="md:col-span-2">
                  {index === 0 && <label className="mb-1 block text-xs text-secondary-600">{t('deliveries.date')}</label>}
                  <input
                    type="date"
                    className="input-field"
                    aria-label={t('deliveries.date')}
                    value={row.deliveryDate}
                    disabled={disabled}
                    onChange={(e) => update(row.key, { deliveryDate: e.target.value })}
                    data-testid={`delivery-date-${index}`}
                  />
                </div>
                <div className="md:col-span-3">
                  {index === 0 && <label className="mb-1 block text-xs text-secondary-600">{t('deliveries.destination')}</label>}
                  <select
                    className="input-field"
                    aria-label={t('deliveries.destination')}
                    value={row.deliveryLocationUuid}
                    disabled={disabled}
                    onChange={(e) => update(row.key, { deliveryLocationUuid: e.target.value })}
                    data-testid={`delivery-location-${index}`}
                  >
                    <option value="">{t('deliveries.noDestination')}</option>
                    {row.deliveryLocationUuid && !knownLocation && (
                      <option value={row.deliveryLocationUuid}>{row.deliveryLocationLabel ?? row.deliveryLocationUuid}</option>
                    )}
                    {locations.map((location) => (
                      <option key={location.uuid} value={location.uuid}>
                        {location.address ?? location.uuid}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  {index === 0 && <label className="mb-1 block text-xs text-secondary-600">{t('deliveries.type')}</label>}
                  <div className="inline-flex" role="group" aria-label={t('deliveries.type')}>
                    {(['quantity', 'percentage'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={disabled}
                        aria-pressed={row.amountType === type}
                        onClick={() => update(row.key, { amountType: type })}
                        className={`${toggleBase} ${
                          row.amountType === type
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-secondary-300 bg-white text-secondary-700'
                        }`}
                        data-testid={`delivery-type-${type}-${index}`}
                      >
                        {type === 'quantity' ? t('deliveries.typeQuantity') : '%'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  {index === 0 && <label className="mb-1 block text-xs text-secondary-600">{t('deliveries.amount')}</label>}
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="input-field"
                    aria-label={t('deliveries.amount')}
                    value={row.amount}
                    disabled={disabled}
                    onChange={(e) => update(row.key, { amount: e.target.value })}
                    data-testid={`delivery-amount-${index}`}
                  />
                </div>
                <div className="md:col-span-2">
                  {index === 0 && <label className="mb-1 block text-xs text-secondary-600">{t('deliveries.resolved')}</label>}
                  <p className="py-2 text-sm text-secondary-900" data-testid={`delivery-resolved-${index}`}>
                    {quantity === null ? '-' : formatNumber(quantity)}
                  </p>
                </div>
                <div className="flex justify-end md:col-span-1">
                  {!disabled && (
                    <ActionButton
                      type="button"
                      tone="danger"
                      label={t('deliveries.remove')}
                      onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                      data-testid={`delivery-remove-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-secondary-100 pt-2 text-sm">
          <span className="text-secondary-700" data-testid="deliveries-total">
            {t('deliveries.total', { total: formatNumber(total), quantity: Number.isFinite(parentQuantity) ? formatNumber(parentQuantity) : '-' })}
          </span>
          {mismatch && (
            <span className="inline-flex items-center gap-1 text-amber-800" role="alert" data-testid="deliveries-mismatch">
              <AlertTriangle className="h-4 w-4" />
              {t('deliveries.mismatch')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveriesEditor;
