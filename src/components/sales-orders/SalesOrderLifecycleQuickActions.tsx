import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Ban } from 'lucide-react';
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
  onError?: (message: string) => void;
}

const FULFILLMENT_CODE = 'orders.manual-fulfillment';
const VOID_CODE = 'orders.delete';

/**
 * The pedido list's one-click cumplimiento / anulación cell: the operator must
 * not have to open the edit form to mark a pedido cumplido (the todo's actual
 * request).
 *
 * Self-contained on purpose — it owns its confirm modal, its permission gate
 * and its API calls, so any list page can mount it with three props and the
 * `sales-order-list` feature re-mounts this exact file in its actions column.
 *
 * The void action always sends `includeProductionOrders: false` (divergence
 * D-4): `ConfirmModal` takes a message, not a form, and cascading a void from a
 * one-click icon is not a decision to take without a checkbox. The edit page's
 * lifecycle block is where the cascade lives.
 */
const SalesOrderLifecycleQuickActions: React.FC<Props> = ({
  order,
  onChanged,
  onError,
}) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const confirmModal = useConfirmModal();
  const [busy, setBusy] = useState(false);

  const fulfilled = Boolean(order.fulfilled);
  const voided = Boolean(order.voided);
  // A fulfilled pedido cannot be voided — the API answers 409 (D-1), so the
  // icon is disabled with the reason rather than left to fail.
  const voidBlocked = fulfilled && !voided;

  const run = async (action: () => Promise<SalesOrder>) => {
    try {
      setBusy(true);
      onChanged(await action());
    } catch (err: any) {
      logger.error('Sales order quick action failed:', err);
      onError?.(
        err?.response?.data?.message || t('salesOrders.lifecycle.error'),
      );
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

  const toggleFulfillment = () => {
    const action = fulfilled ? 'cancel' : 'fulfill';
    confirmThen(
      t(
        fulfilled
          ? 'salesOrders.lifecycle.confirmFulfillCancel'
          : 'salesOrders.lifecycle.confirmFulfill',
        { number: order.number },
      ),
      () => salesOrdersApi.setFulfillment(order.uuid, action),
    );
  };

  /**
   * The cascade clause follows the ACTION, exactly as `SalesOrderLifecycleControl`
   * does it: "NO serán anuladas" describes an anulación, and promising it while
   * CANCELLING one states the opposite of what happens (the linked OPs simply
   * keep their state). Only the "Keeps" variants can appear here — this action
   * always sends `includeProductionOrders: false` (D-4).
   */
  const toggleVoid = () => {
    const action = voided ? 'cancel' : 'void';
    confirmThen(
      `${t(
        voided
          ? 'salesOrders.lifecycle.confirmVoidCancel'
          : 'salesOrders.lifecycle.confirmVoid',
        { number: order.number },
      )} ${t(
        voided
          ? 'salesOrders.lifecycle.confirmVoidCancelKeepsOrders'
          : 'salesOrders.lifecycle.confirmVoidKeepsOrders',
      )}`,
      () => salesOrdersApi.setVoid(order.uuid, action, false),
    );
  };

  return (
    <>
      {has(FULFILLMENT_CODE) && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={toggleFulfillment}
          title={
            fulfilled
              ? t('salesOrders.lifecycle.cancel')
              : t('salesOrders.lifecycle.fulfill')
          }
          data-testid="fulfillment-quick-btn"
        >
          <CheckCircle2
            className={`h-4 w-4 ${fulfilled ? 'text-green-600' : 'text-secondary-400'}`}
          />
        </Button>
      )}
      {has(VOID_CODE) && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy || voidBlocked}
          onClick={toggleVoid}
          title={
            voidBlocked
              ? t('salesOrders.lifecycle.voidBlockedTooltip')
              : voided
                ? t('salesOrders.lifecycle.cancel')
                : t('salesOrders.lifecycle.voidAction')
          }
          data-testid="void-quick-btn"
        >
          <Ban
            className={`h-4 w-4 ${voided ? 'text-red-600' : 'text-secondary-400'}`}
          />
        </Button>
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
    </>
  );
};

export default SalesOrderLifecycleQuickActions;
