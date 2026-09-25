import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import MachineWidthsPicker, { MachineWidthSelection } from './MachineWidthsPicker';
import { CorrugatorBoard, CorrugatorPlan, Machine } from '../../types';
import { corrugatorPlansApi, machinesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: CorrugatorBoard;
  productionOrderUuids: string[];
  onCreated: (plan: CorrugatorPlan) => void;
}

/** Pool card 1 "Crear programa": pick corrugator machine(s) and their reel widths (D-23). */
const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  board,
  productionOrderUuids,
  onCreated,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<MachineWidthSelection>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setSelected({});
    setError('');
    machinesApi
      .getMachines({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((page) => setMachines(page.data.filter((m) => m.machineType?.corrugated && (m.width ?? 0) > 0)))
      .catch((err) => logger.error('Error loading corrugator machines:', err));
  }, [isOpen, effectiveCompanyId]);

  const machineSelections = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, widths]) => widths.length > 0)
        .map(([machineUuid, widths]) => ({ machineUuid, widths })),
    [selected],
  );

  const canSubmit = machineSelections.length > 0 && productionOrderUuids.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const plan = await corrugatorPlansApi.createPlan({
        name: name.trim() || undefined,
        productionOrderUuids,
        machines: machineSelections,
        companyId: effectiveCompanyId,
      });
      onCreated(plan);
    } catch (err: any) {
      logger.error('Error creating corrugator plan:', err);
      setError(err?.response?.data?.message || t('corrugatorPool.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('corrugatorPool.createPlanTitle')} size="lg">
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <p className="text-sm text-secondary-600">
          {t('corrugatorPool.createPlanSubtitle', { count: productionOrderUuids.length, board: board.key })}
        </p>

        <div>
          <label className="gd-label">{t('corrugatorPool.planName')}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('corrugatorPool.planNamePlaceholder')} data-testid="create-plan-name" />
        </div>

        <div>
          <span className="gd-label">{t('corrugatorPool.machines')}</span>
          <MachineWidthsPicker machines={machines} selected={selected} onChange={setSelected} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit} data-testid="create-plan-submit">
            {t('corrugatorPool.createPlanSubmit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePlanModal;
