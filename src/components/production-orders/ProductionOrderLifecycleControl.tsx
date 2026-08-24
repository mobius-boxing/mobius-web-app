import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { ProductionOrder, ProductionOrderLifecycleMachine } from '../../types';
import { productionOrdersApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { logger } from '../../utils/logger';

interface Props {
  order: ProductionOrder;
  onChanged: (updated: ProductionOrder) => void;
}

interface MachineConfig {
  key: 'scheduling' | 'completion' | 'void';
  setAt: keyof ProductionOrder;
  setBy: keyof ProductionOrder;
  cancelledAt: keyof ProductionOrder;
  cancelledBy: keyof ProductionOrder;
  setPath: ProductionOrderLifecycleMachine;
  cancelPath: ProductionOrderLifecycleMachine;
}

const MACHINES: MachineConfig[] = [
  {
    key: 'scheduling',
    setAt: 'schedulingApprovedAt',
    setBy: 'schedulingApprovedByUser',
    cancelledAt: 'schedulingCancelledAt',
    cancelledBy: 'schedulingCancelledByUser',
    setPath: 'enable',
    cancelPath: 'disable',
  },
  {
    key: 'completion',
    setAt: 'completedAt',
    setBy: 'completedByUser',
    cancelledAt: 'completionCancelledAt',
    cancelledBy: 'completionCancelledByUser',
    setPath: 'complete',
    cancelPath: 'complete/cancel',
  },
  {
    key: 'void',
    setAt: 'voidedAt',
    setBy: 'voidedByUser',
    cancelledAt: 'voidCancelledAt',
    cancelledBy: 'voidCancelledByUser',
    setPath: 'void',
    cancelPath: 'void/cancel',
  },
];

/**
 * Habilitación / Cumplimiento / Anulación — three chip+button pairs, one per
 * machine, modelled on `PartApprovalControl` (which is deliberately copied, not
 * generalised: the two share a shape, not a contract).
 *
 * The machines are ORTHOGONAL: none of the six buttons is ever disabled because
 * another machine is in some state. The only disabling is "you are already in
 * that state", which mirrors the server's idempotent write rather than
 * constraining it.
 */
const ProductionOrderLifecycleControl: React.FC<Props> = ({ order, onChanged }) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const [busy, setBusy] = useState(false);
  const canAct = has('production-orders.edit');

  const act = async (path: ProductionOrderLifecycleMachine) => {
    try {
      setBusy(true);
      onChanged(await productionOrdersApi.lifecycle(order.uuid, path));
    } catch (err) {
      logger.error('Production order lifecycle action failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="space-y-2" data-testid="production-order-lifecycle">
      {MACHINES.map((machine) => {
        const setAt = order[machine.setAt] as string | null | undefined;
        const cancelledAt = order[machine.cancelledAt] as string | null | undefined;
        return (
          <div
            key={machine.key}
            className="flex items-center justify-between rounded-lg border border-secondary-200 p-3"
            data-testid={`lifecycle-${machine.key}`}
          >
            <div>
              <div className="text-sm font-medium text-secondary-900">
                {t(`productionOrders.lifecycle.${machine.key}`)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {setAt ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {order[machine.setBy] as string} – {fmt(setAt)}
                  </span>
                ) : cancelledAt ? (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <XCircle className="h-3.5 w-3.5" />
                    [{t('productionOrders.lifecycle.cancelled')}]{' '}
                    {order[machine.cancelledBy] as string} – {fmt(cancelledAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-secondary-500">
                    <Clock className="h-3.5 w-3.5" />
                    {t('productionOrders.lifecycle.pending')}
                  </span>
                )}
              </div>
            </div>
            {canAct && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || !!setAt}
                  data-testid={`lifecycle-${machine.key}-set`}
                  onClick={() => act(machine.setPath)}
                >
                  {t(`productionOrders.lifecycle.set.${machine.key}`)}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  disabled={busy || (!setAt && !!cancelledAt)}
                  data-testid={`lifecycle-${machine.key}-cancel`}
                  onClick={() => act(machine.cancelPath)}
                >
                  {t(`productionOrders.lifecycle.cancel.${machine.key}`)}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductionOrderLifecycleControl;
