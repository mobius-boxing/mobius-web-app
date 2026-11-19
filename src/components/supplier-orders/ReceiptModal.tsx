import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { supplierPurchaseOrdersApi, warehousesApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { SupplierTrackingLine, Warehouse } from '../../types';
import { logger } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  line: SupplierTrackingLine | null;
  onClose: () => void;
  onSuccess: () => void;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Today travels as "now" (the API refuses a future instant); a past day travels as noon UTC so no timezone moves it a day. */
const toInstant = (day: string): string => (day === todayIso() ? new Date().toISOString() : `${day}T12:00:00.000Z`);

export const formatUnits = (value: number): string => String(Math.round(value * 1e4) / 1e4);

/**
 * "Registrar recepción": quantity, date and destination warehouse (default =
 * the machine's destination warehouse). When received + this quantity differs
 * from the ordered one the user must confirm in-page before the request goes
 * out with `confirmMismatch: true` (D-16).
 */
const ReceiptModal: React.FC<Props> = ({ isOpen, line, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [quantity, setQuantity] = useState('');
  const [receivedAt, setReceivedAt] = useState(todayIso());
  const [warehouseUuid, setWarehouseUuid] = useState('');
  const [notes, setNotes] = useState('');
  const [closeLine, setCloseLine] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !line) return;
    setQuantity(String(Math.max(line.quantity - line.receivedQuantity, 0)));
    setReceivedAt(todayIso());
    setWarehouseUuid(line.defaultWarehouse?.uuid ?? '');
    setNotes('');
    setCloseLine(false);
    setConfirming(false);
    setError(null);
    setFieldError(null);
  }, [isOpen, line]);

  useEffect(() => {
    if (!isOpen) return;
    warehousesApi
      .getWarehouses({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((page) => setWarehouses(page.data))
      .catch((err) => logger.error('Error loading warehouses for receipt:', err));
  }, [isOpen, effectiveCompanyId]);

  if (!line) return null;

  const receiving = Number(quantity);
  const total = line.receivedQuantity + (Number.isFinite(receiving) ? receiving : 0);
  const mismatch = total !== line.quantity;

  const submit = async (confirmMismatch: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await supplierPurchaseOrdersApi.createReceipt(line.uuid, {
        quantity: receiving,
        warehouseUuid,
        receivedAt: toInstant(receivedAt),
        ...(confirmMismatch ? { confirmMismatch: true } : {}),
        ...(closeLine ? { closeLine: true } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onSuccess();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.code === 'QUANTITY_MISMATCH') {
        setConfirming(true);
      } else {
        logger.error('Error registering supplier receipt:', err);
        setConfirming(false);
        setError(data?.message || t('supplierTracking.receipt.failed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    if (!Number.isInteger(receiving) || receiving <= 0) {
      setFieldError(t('supplierTracking.receipt.quantityInvalid'));
      return;
    }
    if (!warehouseUuid) {
      setFieldError(t('supplierTracking.receipt.warehouseRequired'));
      return;
    }
    if (mismatch) {
      setConfirming(true);
      return;
    }
    submit(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('supplierTracking.receipt.title')} size="lg">
      <form onSubmit={onFormSubmit} className="space-y-4" noValidate data-testid="receipt-form">
        <ErrorMessage message={error} />
        <div className="rounded-md bg-secondary-50 p-3 text-sm text-secondary-700" data-testid="receipt-line-summary">
          <p>
            <strong>{line.orderNumber}</strong> · {line.supplier.code} · {t('supplierTracking.receipt.po', { number: line.purchaseOrder.number })}
          </p>
          <p>
            {t('supplierTracking.receipt.summary', { ordered: line.quantity, received: line.receivedQuantity })}
          </p>
          {line.sheetsPerUnit ? (
            <p data-testid="receipt-factor">{t('supplierTracking.receipt.factor', { factor: formatUnits(line.sheetsPerUnit) })}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min={1}
            step={1}
            label={t('supplierTracking.receipt.quantity')}
            required
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setConfirming(false);
            }}
            error={fieldError && !(Number.isInteger(receiving) && receiving > 0) ? fieldError : undefined}
            disabled={saving}
            data-testid="receipt-quantity"
          />
          <Input
            type="date"
            label={t('supplierTracking.receipt.receivedAt')}
            max={todayIso()}
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            disabled={saving}
            data-testid="receipt-date"
          />
        </div>

        {line.sheetsPerUnit && Number.isFinite(receiving) && receiving > 0 ? (
          <p className="text-sm text-secondary-700" data-testid="receipt-units-preview">
            {t('supplierTracking.receipt.unitsPreview', { units: formatUnits(receiving / line.sheetsPerUnit) })}
          </p>
        ) : null}

        <div>
          <label className="gd-label">
            {t('supplierTracking.receipt.warehouse')} *
          </label>
          <select
            className="input-field w-full"
            value={warehouseUuid}
            onChange={(e) => setWarehouseUuid(e.target.value)}
            disabled={saving}
            data-testid="receipt-warehouse"
          >
            <option value="">{t('supplierTracking.receipt.selectWarehouse')}</option>
            {warehouses.map((w) => (
              <option key={w.uuid} value={w.uuid}>
                {w.name}
              </option>
            ))}
          </select>
          {fieldError && !warehouseUuid && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
        </div>

        <div>
          <label className="gd-label">{t('supplierTracking.receipt.notes')}</label>
          <textarea className="input-field w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} data-testid="receipt-notes" />
        </div>

        <label className="flex items-center gap-2 text-sm text-secondary-700">
          <input type="checkbox" checked={closeLine} onChange={(e) => setCloseLine(e.target.checked)} disabled={saving} data-testid="receipt-close-line" />
          {t('supplierTracking.receipt.closeLine')}
        </label>

        {confirming && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert" data-testid="receipt-mismatch-alert">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {t('supplierTracking.receipt.mismatchTitle')}
            </div>
            <p>
              {t('supplierTracking.receipt.mismatchBody', {
                ordered: line.quantity,
                received: line.receivedQuantity,
                receiving: Number.isFinite(receiving) ? receiving : 0,
                total,
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => submit(true)} loading={saving} disabled={saving} data-testid="receipt-confirm-mismatch">
                {t('supplierTracking.receipt.confirmMismatch')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={saving} data-testid="receipt-edit-quantity">
                {t('supplierTracking.receipt.editQuantity')}
              </Button>
            </div>
          </div>
        )}

        <ModalFooter onCancel={onClose} loading={saving} submitText={t('supplierTracking.receipt.submit')} submitDisabled={confirming} />
      </form>
    </Modal>
  );
};

export default ReceiptModal;
