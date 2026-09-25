import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/Skeleton';
import { productionOrdersApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { CorrugatorOrderState } from '../../types';

interface ProductionOrderCorrugatorBlockProps {
  orderUuid: string;
}

const STATE_TONE: Record<CorrugatorOrderState['state'], string> = {
  none: 'bg-secondary-100 text-secondary-700',
  partial: 'bg-amber-100 text-amber-700',
  programada: 'bg-green-100 text-green-700',
};

/**
 * Read-only "Corrugadora" block (model.md `~ GET /production-orders/:uuid`,
 * D-9): the list endpoint never carries `corrugator`, so this fetches the
 * detail itself rather than relying on the row the grid already has.
 */
const ProductionOrderCorrugatorBlock: React.FC<ProductionOrderCorrugatorBlockProps> = ({ orderUuid }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<CorrugatorOrderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    productionOrdersApi
      .getProductionOrder(orderUuid)
      .then((order) => {
        if (!cancelled) setState(order.corrugator ?? null);
      })
      .catch((err) => {
        logger.error('Error loading production order corrugator state:', err);
        if (!cancelled) setError(t('productionOrders.corrugator.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderUuid, t]);

  if (loading) return <Skeleton lines={2} data-testid="corrugator-block-loading" />;
  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!state) return null;

  return (
    <div className="rounded-lg border border-secondary-200 p-3" data-testid="production-order-corrugator-block">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium text-secondary-900">{t('productionOrders.corrugator.title')}</h4>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_TONE[state.state]}`}>
          {t(`productionOrders.corrugator.state.${state.state}`)}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-secondary-600 sm:grid-cols-4">
        <div>
          <dt className="text-secondary-400">{t('productionOrders.corrugator.sheetsPerUnit')}</dt>
          <dd>
            {state.sheetsPerUnit}
            {' '}
            ({t(`productionOrders.corrugator.source${state.sheetsSource.charAt(0).toUpperCase()}${state.sheetsSource.slice(1)}`)})
          </dd>
        </div>
        <div>
          <dt className="text-secondary-400">{t('productionOrders.corrugator.required')}</dt>
          <dd>{state.requiredSheets}</dd>
        </div>
        <div>
          <dt className="text-secondary-400">{t('productionOrders.corrugator.allocated')}</dt>
          <dd>{state.allocatedSheets}</dd>
        </div>
        <div>
          <dt className="text-secondary-400">{t('productionOrders.corrugator.pending')}</dt>
          <dd>{state.pendingSheets}</dd>
        </div>
      </dl>
      {state.plans.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-secondary-400">{t('productionOrders.corrugator.plans')}:</span>
          {state.plans.map((p) => (
            <button
              key={p.uuid}
              type="button"
              className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-700 hover:bg-secondary-200"
              onClick={() => navigate(`/corrugator-plans/${p.uuid}`)}
              data-testid={`corrugator-plan-link-${p.uuid}`}
            >
              #{p.number} ({t(`corrugatorPlans.status.${p.status}`)})
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionOrderCorrugatorBlock;
