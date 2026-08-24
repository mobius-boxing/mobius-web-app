import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import ConfirmModal from '../ui/ConfirmModal';
import { GenerationEligibility, ProductionOrder, PromisedQuantityRow } from '../../types';
import { productionOrdersApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Props {
  salesOrderUuid: string;
  open: boolean;
  onClose: () => void;
  onGenerated?: (generated: ProductionOrder[], warnings: string[]) => void;
}

/** A row while it is being edited: the inputs stay strings so typing works. */
interface EditableRow {
  deliveryDate: string;
  quantity: string;
}

/** '2030-01-01T00:00:00.000Z' → '2030-01-01' for a native date input. */
const toDateInput = (value: string | null): string =>
  value ? value.slice(0, 10) : '';

const toIsoOrNull = (value: string): string | null =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;

const numberOf = (value: string): number => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * "¿Desea generarlas automáticamente?" — the `GenerarOrdenesForm` modal.
 *
 * The pedido is seeded as exactly ONE row; the user may split it into N rows of
 * {fecha de entrega, cantidad}. `Porcentaje` is a two-way derived column: it
 * displays `100 × cantidad / pedido.Cantidad` and editing it writes
 * `cantidad = pedido.Cantidad × pct / 100`. When the pedido quantity is zero
 * the percentage is 0 rather than NaN/∞.
 *
 * With `UnaOrdenPorPedido` the split controls are all disabled, which is how
 * the source enforces "one order per pedido" in the UI; the API enforces it
 * again, because a disabled input is not a security boundary.
 */
const GenerateOrdersDialog: React.FC<Props> = ({
  salesOrderUuid,
  open,
  onClose,
  onGenerated,
}) => {
  const { t } = useTranslation();
  const [eligibility, setEligibility] = useState<GenerationEligibility | null>(null);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVoided, setConfirmVoided] = useState(false);

  const pedidoQuantity = eligibility?.defaultRow.quantity ?? 0;
  const locked = eligibility?.oneOrderPerSalesOrder === true;

  // Modals close without unmounting, so every piece of local state is reset on
  // open — a stale row set from the previous pedido would post silently.
  //
  // `t` is NOT a dependency: `useTranslation` hands back a fresh function on
  // every render, so including it makes this effect re-run forever.
  useEffect(() => {
    if (!open) return;
    setRows([]);
    setSelected(0);
    setError(null);
    setConfirmVoided(false);

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result =
          await productionOrdersApi.getGenerationEligibility(salesOrderUuid);
        if (cancelled) return;
        setEligibility(result);
        setRows([
          {
            deliveryDate: toDateInput(result.defaultRow.deliveryDate),
            quantity: String(result.defaultRow.quantity ?? 0),
          },
        ]);
        setSelected(0);
      } catch (err: any) {
        if (cancelled) return;
        logger.error('Error loading generation eligibility:', err);
        setEligibility(null);
        setError(
          err?.response?.data?.message ||
            t('productionOrders.generate.loadFailed'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, salesOrderUuid]);

  const total = rows.reduce((sum, row) => sum + numberOf(row.quantity), 0);
  const mismatch = eligibility != null && total !== pedidoQuantity;

  const percentageOf = (row: EditableRow): string => {
    if (pedidoQuantity <= 0) return '0';
    return String((100 * numberOf(row.quantity)) / pedidoQuantity);
  };

  const setQuantity = (index: number, value: string) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, quantity: value } : row)),
    );
  };

  const setPercentage = (index: number, value: string) => {
    const quantity = (pedidoQuantity * numberOf(value)) / 100;
    setQuantity(index, String(quantity));
  };

  const setDeliveryDate = (index: number, value: string) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, deliveryDate: value } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, { deliveryDate: '', quantity: '0' }]);
  };

  const removeRow = () => {
    setRows((current) =>
      current.length <= 1 ? current : current.filter((_, i) => i !== selected),
    );
    setSelected((current) => (current > 0 ? current - 1 : 0));
  };

  const post = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: PromisedQuantityRow[] = rows.map((row) => ({
        quantity: numberOf(row.quantity),
        deliveryDate: toIsoOrNull(row.deliveryDate),
      }));
      const result = await productionOrdersApi.generate(
        salesOrderUuid,
        payload,
        eligibility?.requiresForce === true,
      );
      onGenerated?.(result.generated, result.warnings);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('productionOrders.generate.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = () => {
    // A voided pedido is a confirm, never a blocker (PedidoDeParteForm.cs:180).
    if (eligibility?.requiresForce) {
      setConfirmVoided(true);
      return;
    }
    void post();
  };

  const blocked = eligibility != null && !eligibility.canGenerate;

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title={t('productionOrders.generate.title')}
        size="lg"
      >
        <div className="space-y-4" data-testid="generate-orders-dialog">
          <ErrorMessage message={error} />

          {loading && (
            <p className="text-sm text-secondary-600" data-testid="generate-loading">
              {t('common.loading')}
            </p>
          )}

          {!loading && blocked && (
            <div className="space-y-2" data-testid="generate-blocked">
              <p className="text-sm font-medium text-secondary-900">
                {t('productionOrders.generate.blockedTitle')}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {eligibility!.blockingReasons.map((reason) => (
                  <li
                    key={reason.code}
                    className="text-sm text-red-700"
                    data-testid={`blocking-reason-${reason.code}`}
                  >
                    {reason.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && eligibility != null && !blocked && (
            <>
              <div>
                <p className="text-sm text-secondary-700">
                  {t('productionOrders.generate.question1')}
                </p>
                <p className="text-sm font-medium text-secondary-900">
                  {t('productionOrders.generate.question2')}
                </p>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600">
                    <th className="py-1 pr-2 font-medium">
                      {t('productionOrders.generate.columns.deliveryDate')}
                    </th>
                    <th className="py-1 pr-2 font-medium">
                      {t('productionOrders.generate.columns.percentage')}
                    </th>
                    <th className="py-1 font-medium">
                      {t('productionOrders.generate.columns.quantity')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={index === selected ? 'bg-primary-50' : undefined}
                      onClick={() => setSelected(index)}
                      data-testid={`generate-row-${index}`}
                    >
                      <td className="py-1 pr-2">
                        <input
                          name={`deliveryDate-${index}`}
                          type="date"
                          className="input-field"
                          data-testid={`generate-delivery-date-${index}`}
                          disabled={locked}
                          value={row.deliveryDate}
                          onChange={(e) => setDeliveryDate(index, e.target.value)}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          name={`percentage-${index}`}
                          type="number"
                          step="any"
                          className="input-field"
                          data-testid={`generate-percentage-${index}`}
                          disabled={locked}
                          value={percentageOf(row)}
                          onChange={(e) => setPercentage(index, e.target.value)}
                        />
                      </td>
                      <td className="py-1">
                        <input
                          name={`quantity-${index}`}
                          type="number"
                          step="any"
                          className="input-field"
                          data-testid={`generate-quantity-${index}`}
                          disabled={locked}
                          value={row.quantity}
                          onChange={(e) => setQuantity(index, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={locked}
                  data-testid="generate-add-row"
                  onClick={addRow}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={locked || rows.length <= 1}
                  data-testid="generate-remove-row"
                  onClick={removeRow}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="ml-auto text-sm text-secondary-600" data-testid="generate-total">
                  {t('productionOrders.generate.total', {
                    total,
                    pedido: pedidoQuantity,
                  })}
                </span>
              </div>

              {mismatch && (
                <p
                  className="flex items-center gap-1.5 text-sm text-amber-700"
                  data-testid="generate-sum-warning"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t('productionOrders.generate.sumMismatch')}
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-secondary-200 pt-4">
            <Button variant="ghost" onClick={onClose} data-testid="generate-no">
              {t('productionOrders.generate.no')}
            </Button>
            <Button
              onClick={handleAccept}
              loading={saving}
              disabled={loading || blocked}
              data-testid="generate-yes"
            >
              {t('productionOrders.generate.yes')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmVoided}
        onClose={() => setConfirmVoided(false)}
        onConfirm={() => {
          setConfirmVoided(false);
          void post();
        }}
        title={t('productionOrders.generate.voidedTitle')}
        message={t('productionOrders.generate.voidedConfirm')}
        confirmText={t('productionOrders.generate.yes')}
        variant="warning"
      />
    </>
  );
};

export default GenerateOrdersDialog;
