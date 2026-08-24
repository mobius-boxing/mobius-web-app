import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import ConfirmModal from '../ui/ConfirmModal';
import { SalesOrder } from '../../types';
import { salesOrdersApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { logger } from '../../utils/logger';

interface Props {
  order: SalesOrder;
  onChanged: (updated: SalesOrder) => void;
}

interface RowState {
  setAt?: string | null;
  setBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
}

const FULFILLMENT_CODE = 'orders.manual-fulfillment';
const VOID_CODE = 'orders.delete';

/**
 * "Estado del pedido": cumplimiento and anulación, the two Procusto pair
 * machines that `SalesOrderApprovalControl` deliberately leaves alone.
 *
 * Three rules this control does NOT share with the approvals block beside it:
 *  - each button PAIR is omitted from the DOM without its catalogue code
 *    (the approvals block disables instead — here the permission is the
 *    difference between an operator and an auditor, and a dead button on a
 *    soft-delete is worse than no button);
 *  - `Anular` is refused for a fulfilled pedido, mirroring the API's 409
 *    (PLSUseCases.Pedidos/Listar.cs:72-75, divergence D-1);
 *  - the anulación row carries the `incluirOrdenes` checkbox, which is the ONLY
 *    surface that can cascade the void onto the pedido's production orders.
 */
const SalesOrderLifecycleControl: React.FC<Props> = ({ order, onChanged }) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const confirmModal = useConfirmModal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeProductionOrders, setIncludeProductionOrders] = useState(false);

  const canFulfill = has(FULFILLMENT_CODE);
  const canVoid = has(VOID_CODE);

  const fmt = (value: string): string => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const run = async (action: () => Promise<SalesOrder>) => {
    try {
      setBusy(true);
      setError(null);
      onChanged(await action());
    } catch (err: any) {
      logger.error('Sales order lifecycle action failed:', err);
      setError(err?.response?.data?.message || t('salesOrders.lifecycle.error'));
    } finally {
      setBusy(false);
    }
  };

  const confirmThen = (message: string, action: () => Promise<SalesOrder>) => {
    confirmModal.showConfirm({
      title: t('salesOrders.lifecycle.title'),
      message,
      variant: 'warning',
      onConfirm: () => run(action),
    });
  };

  const fulfill = (action: 'fulfill' | 'cancel') =>
    confirmThen(
      t(
        action === 'fulfill'
          ? 'salesOrders.lifecycle.confirmFulfill'
          : 'salesOrders.lifecycle.confirmFulfillCancel',
        { number: order.number },
      ),
      () => salesOrdersApi.setFulfillment(order.uuid, action),
    );

  /**
   * The cascade clause depends on the ACTION as much as on the checkbox: with
   * `cancel` the DAO clears `voidedAt` on every linked OP, so they stop being
   * anuladas — the opposite of what the `void` wording announces. This is the
   * only surface that cascades, so it must describe the cascade it performs
   * (sales-order-lifecycle.dao.ts:224-240).
   */
  const cascadeClause = (action: 'void' | 'cancel'): string => {
    if (action === 'void') {
      return includeProductionOrders
        ? t('salesOrders.lifecycle.confirmVoidIncludesOrders')
        : t('salesOrders.lifecycle.confirmVoidKeepsOrders');
    }
    return includeProductionOrders
      ? t('salesOrders.lifecycle.confirmVoidCancelIncludesOrders')
      : t('salesOrders.lifecycle.confirmVoidCancelKeepsOrders');
  };

  const voidOrder = (action: 'void' | 'cancel') =>
    confirmThen(
      `${t(
        action === 'void'
          ? 'salesOrders.lifecycle.confirmVoid'
          : 'salesOrders.lifecycle.confirmVoidCancel',
        { number: order.number },
      )} ${cascadeClause(action)}`,
      () =>
        salesOrdersApi.setVoid(order.uuid, action, includeProductionOrders),
    );

  /** Stamped wins over cancelled (AuxiliaresAprobacion.cs:9-17). */
  const statusText = (state: RowState): React.ReactNode => {
    if (state.setAt) {
      return (
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.setBy} – {fmt(state.setAt)}
        </span>
      );
    }
    if (state.cancelledAt) {
      return (
        <span className="inline-flex items-center gap-1 text-red-700">
          <XCircle className="h-3.5 w-3.5" />[
          {t('salesOrders.lifecycle.cancelled')}] {state.cancelledBy} –{' '}
          {fmt(state.cancelledAt)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-secondary-500">
        <Clock className="h-3.5 w-3.5" />
        {t('salesOrders.lifecycle.pending')}
      </span>
    );
  };

  const fulfilled = Boolean(order.fulfilledAt);
  const voided = Boolean(order.voidedAt);

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200"
      data-testid="sales-order-lifecycle"
    >
      <h2 className="text-lg font-semibold text-secondary-900 mb-2">
        {t('salesOrders.lifecycle.title')}
      </h2>

      <div
        className="flex items-center justify-between border-b border-secondary-100 py-2"
        data-testid="sales-order-lifecycle-fulfillment"
      >
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {t('salesOrders.lifecycle.fulfillment')}
          </div>
          <div
            className="mt-1 text-xs"
            data-testid="sales-order-lifecycle-fulfillment-status"
          >
            {statusText({
              setAt: order.fulfilledAt,
              setBy: order.fulfilledBy,
              cancelledAt: order.fulfillmentCancelledAt,
              cancelledBy: order.fulfillmentCancelledBy,
            })}
          </div>
        </div>
        {canFulfill && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || fulfilled}
              onClick={() => fulfill('fulfill')}
              data-testid="sales-order-lifecycle-fulfill"
            >
              {t('salesOrders.lifecycle.fulfill')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              disabled={busy || !fulfilled}
              onClick={() => fulfill('cancel')}
              data-testid="sales-order-lifecycle-fulfill-cancel"
            >
              {t('salesOrders.lifecycle.cancel')}
            </Button>
          </div>
        )}
      </div>

      <div
        className="flex items-start justify-between py-2"
        data-testid="sales-order-lifecycle-void"
      >
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {t('salesOrders.lifecycle.void')}
          </div>
          <div
            className="mt-1 text-xs"
            data-testid="sales-order-lifecycle-void-status"
          >
            {statusText({
              setAt: order.voidedAt,
              setBy: order.voidedBy,
              cancelledAt: order.voidCancelledAt,
              cancelledBy: order.voidCancelledBy,
            })}
          </div>
          {canVoid && (
            <label className="mt-2 flex items-center gap-2 text-xs text-secondary-600">
              <input
                type="checkbox"
                name="includeProductionOrders"
                checked={includeProductionOrders}
                onChange={(e) => setIncludeProductionOrders(e.target.checked)}
                data-testid="sales-order-lifecycle-include-orders"
              />
              {t('salesOrders.lifecycle.includeProductionOrders')}
            </label>
          )}
        </div>
        {canVoid && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || voided || fulfilled}
              title={
                fulfilled && !voided
                  ? t('salesOrders.lifecycle.voidBlockedTooltip')
                  : undefined
              }
              onClick={() => voidOrder('void')}
              data-testid="sales-order-lifecycle-void-action"
            >
              {t('salesOrders.lifecycle.voidAction')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              disabled={busy || !voided}
              onClick={() => voidOrder('cancel')}
              data-testid="sales-order-lifecycle-void-cancel"
            >
              {t('salesOrders.lifecycle.cancel')}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div
          className="mt-2 text-xs text-red-600"
          data-testid="sales-order-lifecycle-error"
        >
          {error}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.handleClose}
        onConfirm={confirmModal.handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default SalesOrderLifecycleControl;
