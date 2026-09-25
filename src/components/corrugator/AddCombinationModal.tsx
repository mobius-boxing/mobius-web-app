import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import LaneDiagram, { LaneSegment } from './LaneDiagram';
import { CorrugatorCandidate, CorrugatorPlan, CorrugatorPlanOrder } from '../../types';
import { corrugatorPlansApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface AddCombinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CorrugatorPlan;
  /** The order the candidate list must contain — usually the row's "Agregar combinación" action. */
  order: CorrugatorPlanOrder;
  onAdded: (plan: CorrugatorPlan) => void;
}

const machineWidthOf = (machineKey: string): number => Number(machineKey.slice(machineKey.lastIndexOf(':') + 1));

/** Card 3 "Agregar combinación": candidates from `enumerate()` re-run on the current lines (D-18). */
const AddCombinationModal: React.FC<AddCombinationModalProps> = ({ isOpen, onClose, plan, order, onAdded }) => {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState<CorrugatorCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setLoading(true);
    corrugatorPlansApi
      .getCandidates(plan.uuid, order.uuid)
      .then(setCandidates)
      .catch((err) => {
        logger.error('Error loading corrugator candidates:', err);
        setError(err?.response?.data?.message || t('corrugatorPlan.candidatesFailed'));
      })
      .finally(() => setLoading(false));
  }, [isOpen, plan.uuid, order.uuid, t]);

  const orderByUuid = new Map((plan.orders ?? []).map((o) => [o.uuid, o]));

  const lanesFor = (candidate: CorrugatorCandidate): LaneSegment[] =>
    candidate.items.map((item, index) => {
      const planOrder = orderByUuid.get(item.orderUuid);
      const runWidth = planOrder ? (item.rotated ? planOrder.sheetLength : planOrder.sheetWidth) : 0;
      return {
        key: `${item.orderUuid}-${index}`,
        orderNumber: planOrder?.productionOrder.number ?? item.orderUuid,
        runWidth,
        count: item.count,
        rotated: item.rotated,
      };
    });

  const handlePick = async (candidate: CorrugatorCandidate, index: number) => {
    setSubmitting(index);
    setError('');
    try {
      const updated = await corrugatorPlansApi.addCombination(plan.uuid, {
        machineKey: candidate.machineKey,
        items: candidate.items,
        meters: candidate.suggestedMeters,
      });
      onAdded(updated);
    } catch (err: any) {
      logger.error('Error adding corrugator combination:', err);
      setError(err?.response?.data?.message || t('corrugatorPlan.addCombinationFailed'));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('corrugatorPlan.addCombinationTitle', { number: order.productionOrder.number })}
      size="xl"
    >
      <div className="space-y-3">
        <ErrorMessage message={error} />
        {loading ? (
          <p className="text-sm text-secondary-500">{t('common.loading')}</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-secondary-500" data-testid="add-combination-empty">
            {t('corrugatorPlan.noCandidates')}
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {candidates.map((candidate, index) => (
              <div
                key={`${candidate.machineKey}-${index}`}
                className="rounded-lg border border-secondary-200 p-3"
                data-testid="candidate-row"
              >
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-secondary-900">
                    {machineWidthOf(candidate.machineKey)} mm — {t('corrugatorPlan.refile')} {candidate.refile.toFixed(2)}%
                  </span>
                  <span className="text-secondary-500">
                    {t('corrugatorPlan.suggestedMeters')}: {candidate.suggestedMeters} m
                  </span>
                </div>
                <LaneDiagram
                  reelWidth={machineWidthOf(candidate.machineKey)}
                  machineTrim={0}
                  transversalRefile={candidate.transversalRefile}
                  lanes={lanesFor(candidate)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handlePick(candidate, index)}
                    loading={submitting === index}
                    disabled={submitting !== null}
                    data-testid="candidate-pick"
                  >
                    {t('corrugatorPlan.pickCandidate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddCombinationModal;
