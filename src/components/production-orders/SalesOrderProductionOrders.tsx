import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductionOrdersGrid from './ProductionOrdersGrid';
import GenerateOrdersDialog from './GenerateOrdersDialog';
import { productionOrdersApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { logger } from '../../utils/logger';

interface Props {
  salesOrderUuid: string;
  commerciallyApproved: boolean;
  financiallyApproved: boolean;
  /** Changes on every successful save; that is what re-arms the offer. */
  savedAt?: string | null;
}

/**
 * The pedido edit page's single production-orders mount: the órdenes list for
 * this pedido plus the "offer to generate" dialog.
 *
 * Generation is OFFERED, never automatic (open question (a)): saving an
 * approved pedido that has no orders opens the same modal question the source
 * shows, and only a `Sí` writes anything. The offer is armed once per save —
 * dismissing it must not re-open it on the next render — and it is only armed
 * when BOTH approvals are in place, which is the source's guard.
 */
const SalesOrderProductionOrders: React.FC<Props> = ({
  salesOrderUuid,
  commerciallyApproved,
  financiallyApproved,
  savedAt,
}) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const [offering, setOffering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  /** The `savedAt` whose offer has already been made or declined. */
  const offeredFor = useRef<string | null>(null);

  const canGenerate = has('production-orders.generate');
  const approved = commerciallyApproved && financiallyApproved;

  const maybeOffer = useCallback(async () => {
    if (!canGenerate || !approved || !savedAt) return;
    if (offeredFor.current === savedAt) return;
    offeredFor.current = savedAt;
    try {
      const eligibility =
        await productionOrdersApi.getGenerationEligibility(salesOrderUuid);
      if (eligibility.canGenerate && !eligibility.alreadyHasOrders) {
        setOffering(true);
      }
    } catch (err) {
      // A failed probe must never block the form; the manual button remains.
      logger.error('Error checking generation eligibility:', err);
    }
  }, [canGenerate, approved, savedAt, salesOrderUuid]);

  useEffect(() => {
    void maybeOffer();
  }, [maybeOffer]);

  return (
    <div className="space-y-3 rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-secondary-900">
        {t('productionOrders.forSalesOrder')}
      </h2>
      <ProductionOrdersGrid
        key={reloadKey}
        salesOrderUuid={salesOrderUuid}
        compact
      />
      <GenerateOrdersDialog
        salesOrderUuid={salesOrderUuid}
        open={offering}
        onClose={() => setOffering(false)}
        onGenerated={() => {
          setOffering(false);
          setReloadKey((key) => key + 1);
        }}
      />
    </div>
  );
};

export default SalesOrderProductionOrders;
