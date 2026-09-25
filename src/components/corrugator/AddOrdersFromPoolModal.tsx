import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { CorrugatorPlan, CorrugatorPoolOrder } from '../../types';
import { corrugatorPlansApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface AddOrdersFromPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CorrugatorPlan;
  onAdded: () => void;
}

/** Plan editor "add from pool" — same board group (I-2), excluding orders already on the plan. */
const AddOrdersFromPoolModal: React.FC<AddOrdersFromPoolModalProps> = ({ isOpen, onClose, plan, onAdded }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [orders, setOrders] = useState<CorrugatorPoolOrder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setError('');
    setLoading(true);
    const inPlan = new Set((plan.orders ?? []).map((o) => o.productionOrder.uuid));
    corrugatorPlansApi
      .getPool({ ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((pool) => {
        const group = pool.groups.find((g) => g.board.key === plan.board.key);
        setOrders((group?.orders ?? []).filter((o) => !inPlan.has(o.productionOrder.uuid)));
      })
      .catch((err) => logger.error('Error loading pool for plan:', err))
      .finally(() => setLoading(false));
  }, [isOpen, plan.board.key, plan.orders, effectiveCompanyId]);

  const toggle = (uuid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await corrugatorPlansApi.addOrders(plan.uuid, Array.from(selected));
      onAdded();
    } catch (err: any) {
      logger.error('Error adding orders to corrugator plan:', err);
      setError(err?.response?.data?.message || t('corrugatorPlan.addOrdersFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('corrugatorPlan.addOrdersTitle')} size="lg">
      <div className="space-y-3">
        <ErrorMessage message={error} />
        {loading ? (
          <p className="text-sm text-secondary-500">{t('common.loading')}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-secondary-500" data-testid="add-orders-empty">{t('corrugatorPlan.noPoolOrders')}</p>
        ) : (
          <div className="max-h-[50vh] divide-y divide-secondary-100 overflow-y-auto rounded border border-secondary-200">
            {orders.map((order) => (
              <label key={order.productionOrder.uuid} className="flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(order.productionOrder.uuid)}
                  onChange={() => toggle(order.productionOrder.uuid)}
                  data-testid={`add-orders-checkbox-${order.productionOrder.uuid}`}
                />
                <span className="font-medium text-secondary-900">{order.productionOrder.number}</span>
                <span className="text-secondary-500">{order.customer?.name ?? '-'} · {order.product.code}</span>
                <span className="ml-auto text-secondary-500">{order.pendingSheets} {t('corrugatorPool.columns.pending')}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={selected.size === 0} data-testid="add-orders-submit">
            {t('corrugatorPlan.addOrdersSubmit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddOrdersFromPoolModal;
