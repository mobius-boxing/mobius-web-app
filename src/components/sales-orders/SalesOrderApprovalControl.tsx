import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { SalesOrder, SalesOrderApprovalMachine } from '../../types';
import { salesOrdersApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { logger } from '../../utils/logger';

interface Props {
  order: SalesOrder;
  onChanged: (updated: SalesOrder) => void;
}

interface RowState {
  approvedAt?: string | null;
  approvedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
}

/**
 * `dd/MM/yyyy HH:mm`, 24-hour and zero-padded (divergence D-6: Procusto's
 * `hh:mm` is 12-hour with no AM/PM designator, which is ambiguous). Local to
 * this component on purpose — the app has no date-format convention yet and
 * one feature must not invent one.
 */
const fmt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * The pedido's "Aprobaciones" block: commercial approval, financial approval
 * and the read-only credit-limit override (EdicionDatosPedido.cs:1004-1027,956).
 *
 * Three deliberate differences from PartApprovalControl.tsx:
 *  - buttons are rendered DISABLED, never hidden, when the permission is
 *    missing (Procusto disables the whole control, EdicionDatosPedido.cs:147-148);
 *  - `Cancelar` is enabled iff the machine IS approved (AprobacionControl.cs:
 *    148-149) — PartApprovalControl.tsx:80's condition differs and is not copied;
 *  - timestamps render `dd/MM/yyyy HH:mm` (D-6).
 */
const SalesOrderApprovalControl: React.FC<Props> = ({ order, onChanged }) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const [busy, setBusy] = useState<SalesOrderApprovalMachine | null>(null);

  const act = async (machine: SalesOrderApprovalMachine, action: 'approve' | 'cancel') => {
    try {
      setBusy(machine);
      const updated = await salesOrdersApi.setApproval(order.uuid, machine, action);
      // No optimistic update and no reload: the returned DTO IS the new state.
      onChanged(updated);
    } catch (err) {
      logger.error('Sales order approval action failed:', err);
    } finally {
      setBusy(null);
    }
  };

  /** Approved wins over cancelled (AuxiliaresAprobacion.cs:9-17). */
  const statusText = (state: RowState): React.ReactNode => {
    if (state.approvedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.approvedBy} - {fmt(state.approvedAt)}
        </span>
      );
    }
    if (state.cancelledAt) {
      return (
        <span className="inline-flex items-center gap-1 text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          [{t('salesOrders.approvals.cancelled')}] {state.cancelledBy} - {fmt(state.cancelledAt)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-secondary-500">
        <Clock className="h-3.5 w-3.5" />
        {t('salesOrders.approvals.pending')}
      </span>
    );
  };

  const machineRow = (machine: SalesOrderApprovalMachine, state: RowState) => {
    const canAct = has(`orders.approve.${machine}`);
    // Only the machine whose request is in flight locks: the two are
    // independent, and `busy !== null` froze the other row for no reason.
    const inFlight = busy === machine;
    const approved = Boolean(state.approvedAt);

    return (
      <div
        className="flex items-center justify-between border-b border-secondary-100 py-2 last:border-b-0"
        data-testid={`sales-order-approval-${machine}`}
      >
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {t(`salesOrders.approvals.${machine}`)}
          </div>
          <div className="mt-1 text-xs" data-testid={`sales-order-approval-${machine}-status`}>
            {statusText(state)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!canAct || inFlight || approved}
            onClick={() => act(machine, 'approve')}
            data-testid={`sales-order-approval-${machine}-approve`}
          >
            {t('salesOrders.approvals.approve')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600"
            disabled={!canAct || inFlight || !approved}
            onClick={() => act(machine, 'cancel')}
            data-testid={`sales-order-approval-${machine}-cancel`}
          >
            {t('salesOrders.approvals.cancel')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200"
      data-testid="sales-order-approvals"
    >
      <h2 className="text-lg font-semibold text-secondary-900 mb-2">
        {t('salesOrders.approvals.title')}
      </h2>

      {machineRow('commercial', {
        approvedAt: order.commercialApprovedAt,
        approvedBy: order.commercialApprovedBy,
        cancelledAt: order.commercialCancelledAt,
        cancelledBy: order.commercialCancelledBy,
      })}
      {machineRow('financial', {
        approvedAt: order.financialApprovedAt,
        approvedBy: order.financialApprovedBy,
        cancelledAt: order.financialCancelledAt,
        cancelledBy: order.financialCancelledBy,
      })}

      {/* Display-only: the credit engine is out of scope, so no buttons at all
          (EdicionDatosPedido.cs:266 HabilitarBotones = false). */}
      <div
        className="flex items-center justify-between py-2"
        data-testid="sales-order-approval-credit-override"
      >
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {t('salesOrders.approvals.creditOverride')}
          </div>
          <div
            className="mt-1 text-xs"
            data-testid="sales-order-approval-credit-override-status"
          >
            {statusText({
              approvedAt: order.creditLimitOverrideAt,
              approvedBy: order.creditLimitOverrideBy,
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderApprovalControl;
