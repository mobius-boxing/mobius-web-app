import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Factory, Play, Plus, Printer, Trash2, Undo2, XCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Card from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import ConfirmModal from '../components/ui/ConfirmModal';
import LaneDiagram from '../components/corrugator/LaneDiagram';
import MachineWidthsPicker, { MachineWidthSelection } from '../components/corrugator/MachineWidthsPicker';
import AddCombinationModal from '../components/corrugator/AddCombinationModal';
import AddOrdersFromPoolModal from '../components/corrugator/AddOrdersFromPoolModal';
import { corrugatorPlansApi, machinesApi } from '../services/api';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import { logger } from '../utils/logger';
import {
  CorrugatorFulfillment,
  CorrugatorParameters,
  CorrugatorPlan as CorrugatorPlanData,
  CorrugatorPlanCombination,
  CorrugatorPlanItem,
  CorrugatorPlanOrder,
  CorrugatorPlanStatus,
  Machine,
} from '../types';
import { machineUuidOf } from '../components/corrugator/machineKey';


const STATUS_TONE: Record<CorrugatorPlanStatus, string> = {
  draft: 'bg-secondary-100 text-secondary-700',
  solving: 'bg-amber-100 text-amber-700',
  solved: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  registered: 'bg-primary-100 text-primary-700',
};

const StatusPill: React.FC<{ status: CorrugatorPlanStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`} data-testid="plan-status-pill">
      {t(`corrugatorPlans.status.${status}`)}
    </span>
  );
};

const FULFILLMENT_TONE: Record<CorrugatorFulfillment, string> = {
  empty: 'bg-secondary-100 text-secondary-700',
  partial: 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
  exceeded: 'bg-blue-100 text-blue-700',
};

const FulfillmentPill: React.FC<{ state?: CorrugatorFulfillment }> = ({ state }) => {
  const { t } = useTranslation();
  if (!state) return <span className="text-secondary-400">-</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FULFILLMENT_TONE[state]}`}>
      {t(`corrugatorPlan.fulfillmentState.${state}`)}
    </span>
  );
};

const Kpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-secondary-200 bg-white p-3 text-center shadow-sm">
    <div className="text-lg font-semibold text-secondary-900">{value}</div>
    <div className="text-xs text-secondary-500">{label}</div>
  </div>
);

// D-44: `minRun` is a constraint by default now — `minRunLength` stays visible;
// `minMeters` (post-solve discard threshold) moves under "Avanzado".
const PARAM_MAIN_KEYS = ['scrapAbsolute', 'minRunLength', 'maxGap', 'timeLimitSeconds'] as const;
const PARAM_ADVANCED_KEYS = [
  'scrapPercentage', 'excessFactor', 'minMeters', 'minFormatLength', 'limitCombinations',
  'costViolationLower', 'costViolationUpper', 'costViolationLowerMandatory', 'costViolationUpperMandatory',
  'costFormatChange', 'averageGrammage', 'roundingFactor',
] as const;
const CONSTRAINT_KEYS = ['violationLower', 'violationUpper', 'minRun', 'conditionalProduction', 'minFormat'] as const;

interface RegisterConflict {
  code: 'STALE_PENDING' | 'OVER_ALLOCATED';
  message: string;
  orders: Array<Record<string, unknown>>;
}

/** Cards 2+3: plan editor — machines/widths, parameters, orders, solve, adjust, register/undo. */
const CorrugatorPlan: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();
  const canEdit = has('corrugator.plan');
  const canRegister = has('corrugator.register');

  const [plan, setPlan] = useState<CorrugatorPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [registerConflict, setRegisterConflict] = useState<RegisterConflict | null>(null);
  const [moveErrors, setMoveErrors] = useState<Record<string, string>>({});

  const [addCombinationFor, setAddCombinationFor] = useState<CorrugatorPlanOrder | null>(null);
  const [addOrdersOpen, setAddOrdersOpen] = useState(false);
  const [machinesEditorOpen, setMachinesEditorOpen] = useState(false);
  const [machineSelection, setMachineSelection] = useState<MachineWidthSelection>({});
  const [corrugatorMachines, setCorrugatorMachines] = useState<Machine[]>([]);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [paramsDraft, setParamsDraft] = useState<CorrugatorParameters | null>(null);

  const fetchPlan = useCallback(() => {
    if (!uuid) return;
    setLoading(true);
    setLoadError(null);
    corrugatorPlansApi
      .getPlan(uuid)
      .then((data) => {
        setPlan(data);
        setParamsDraft(data.parameters);
      })
      .catch((err) => {
        logger.error('Error loading corrugator plan:', err);
        setLoadError(err?.response?.data?.message || t('corrugatorPlan.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [uuid, t]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Card 2: poll every 2 s while the worker runs (D-3), plus a 1 s ticker for
  // the elapsed-time display — both stop the moment `status` leaves 'solving'.
  useEffect(() => {
    if (!plan || plan.status !== 'solving' || !uuid) return;
    const poll = setInterval(() => {
      corrugatorPlansApi.getPlan(uuid).then(setPlan).catch((err) => logger.error('Error polling corrugator plan:', err));
    }, 2000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.status, uuid]);

  useEffect(() => {
    if (!plan || plan.status !== 'solving') return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.status]);

  useEffect(() => {
    if (!machinesEditorOpen) return;
    machinesApi
      .getMachines({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((page) => setCorrugatorMachines(page.data.filter((m) => m.machineType?.corrugated && (m.width ?? 0) > 0)))
      .catch((err) => logger.error('Error loading corrugator machines:', err));
  }, [machinesEditorOpen, effectiveCompanyId]);

  useEffect(() => {
    if (!machinesEditorOpen || !plan) return;
    const seed: MachineWidthSelection = {};
    for (const m of plan.machines) seed[m.machineUuid] = m.widths.length ? m.widths : [m.width];
    setMachineSelection(seed);
  }, [machinesEditorOpen, plan]);

  if (loading) {
    return (
      <Layout>
        <Skeleton lines={8} data-testid="corrugator-plan-loading" />
      </Layout>
    );
  }

  if (loadError || !plan) {
    return (
      <Layout>
        <ErrorMessage message={loadError ?? t('corrugatorPlan.notFound')} />
      </Layout>
    );
  }

  const elapsedSeconds = plan.solve?.startedAt
    ? Math.max(0, Math.floor((now - new Date(plan.solve.startedAt).getTime()) / 1000))
    : 0;

  const combosByMachine = new Map<string, CorrugatorPlanCombination[]>();
  for (const combo of plan.combinations ?? []) {
    const muid = machineUuidOf(combo.machineKey);
    if (!combosByMachine.has(muid)) combosByMachine.set(muid, []);
    combosByMachine.get(muid)!.push(combo);
  }
  Array.from(combosByMachine.values()).forEach((list) => list.sort((a, b) => a.sequence - b.sequence));

  const locked = plan.status === 'registered';
  const canMutate = canEdit && !locked && plan.status !== 'solving';
  const paramsDisabled = !canEdit || plan.status === 'solving' || locked;

  const handleSolve = async () => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.solve(plan.uuid));
    } catch (err: any) {
      logger.error('Error starting corrugator solve:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.solveFailed'));
    }
  };

  const handleCancelSolve = async () => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.cancelSolve(plan.uuid));
    } catch (err: any) {
      logger.error('Error cancelling corrugator solve:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.cancelFailed'));
    }
  };

  const doRegister = async (force: boolean) => {
    setActionError(null);
    setRegisterConflict(null);
    try {
      setPlan(await corrugatorPlansApi.register(plan.uuid, force));
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'STALE_PENDING' || code === 'OVER_ALLOCATED') {
        setRegisterConflict({
          code,
          message: err?.response?.data?.message || code,
          orders: err?.response?.data?.orders ?? [],
        });
      } else {
        logger.error('Error registering corrugator plan:', err);
        setActionError(err?.response?.data?.message || t('corrugatorPlan.registerFailed'));
      }
    }
  };

  const handleUnregister = async () => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.unregister(plan.uuid));
    } catch (err: any) {
      logger.error('Error unregistering corrugator plan:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.unregisterFailed'));
    }
  };

  const handleDeletePlan = () => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('corrugatorPlan.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await corrugatorPlansApi.deletePlan(plan.uuid);
          navigate('/corrugator-plans');
        } catch (err: any) {
          logger.error('Error deleting corrugator plan:', err);
          setActionError(err?.response?.data?.message || t('corrugatorPlan.deleteFailed'));
        }
      },
    });
  };

  const saveMachines = async () => {
    const machines = Object.entries(machineSelection)
      .filter(([, widths]) => widths.length > 0)
      .map(([machineUuid, widths]) => ({ machineUuid, widths }));
    const apply = async () => {
      try {
        setPlan(await corrugatorPlansApi.updatePlan(plan.uuid, { machines }));
        setMachinesEditorOpen(false);
      } catch (err: any) {
        logger.error('Error updating corrugator plan machines:', err);
        setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
      }
    };
    if (plan.status === 'solved' || plan.status === 'failed') {
      confirmModal.showConfirm({
        title: t('corrugatorPlan.discardSolutionTitle'),
        message: t('corrugatorPlan.discardSolutionMessage'),
        variant: 'warning',
        onConfirm: apply,
      });
    } else {
      await apply();
    }
  };

  const saveParameters = async () => {
    if (!paramsDraft) return;
    const apply = async () => {
      try {
        setPlan(await corrugatorPlansApi.updatePlan(plan.uuid, { parameters: paramsDraft }));
      } catch (err: any) {
        logger.error('Error updating corrugator plan parameters:', err);
        setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
      }
    };
    if (plan.status === 'solved' || plan.status === 'failed') {
      confirmModal.showConfirm({
        title: t('corrugatorPlan.discardSolutionTitle'),
        message: t('corrugatorPlan.discardSolutionMessage'),
        variant: 'warning',
        onConfirm: apply,
      });
    } else {
      await apply();
    }
  };

  const updateOrderField = async (order: CorrugatorPlanOrder, patch: Record<string, unknown>) => {
    setActionError(null);
    try {
      // The line endpoint answers with the line alone; the plan (and its invalidation) is re-read.
      await corrugatorPlansApi.updateOrder(plan.uuid, order.uuid, patch);
      fetchPlan();
    } catch (err: any) {
      logger.error('Error updating corrugator plan order:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
    }
  };

  const removeOrder = (order: CorrugatorPlanOrder) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('corrugatorPlan.removeOrderConfirm', { number: order.productionOrder.number }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await corrugatorPlansApi.removeOrder(plan.uuid, order.uuid);
          fetchPlan();
        } catch (err: any) {
          logger.error('Error removing corrugator plan order:', err);
          setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
        }
      },
    });
  };

  const moveSequence = async (combo: CorrugatorPlanCombination, delta: number) => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.setCombinationSequence(plan.uuid, combo.uuid, combo.sequence + delta));
    } catch (err: any) {
      logger.error('Error reordering corrugator combination:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
    }
  };

  /** D-44: move a run to another reel width of the plan (any machine × width pair). */
  const setMachineKey = async (combo: CorrugatorPlanCombination, machineKey: string) => {
    if (machineKey === combo.machineKey) return;
    setMoveErrors((prev) => ({ ...prev, [combo.uuid]: '' }));
    try {
      setPlan(await corrugatorPlansApi.setCombinationMachineKey(plan.uuid, combo.uuid, machineKey));
    } catch (err: any) {
      logger.error('Error moving corrugator combination:', err);
      setMoveErrors((prev) => ({ ...prev, [combo.uuid]: err?.response?.data?.message || t('corrugatorPlan.updateFailed') }));
    }
  };

  const setMeters = async (combo: CorrugatorPlanCombination, meters: number) => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.setCombinationMeters(plan.uuid, combo.uuid, meters));
    } catch (err: any) {
      logger.error('Error updating corrugator combination meters:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
    }
  };

  const deleteCombination = (combo: CorrugatorPlanCombination) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('corrugatorPlan.deleteCombinationConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setPlan(await corrugatorPlansApi.deleteCombination(plan.uuid, combo.uuid));
        } catch (err: any) {
          logger.error('Error deleting corrugator combination:', err);
          setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
        }
      },
    });
  };

  const deleteItem = (combo: CorrugatorPlanCombination, item: CorrugatorPlanItem) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('corrugatorPlan.deleteLaneConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setPlan(await corrugatorPlansApi.deleteItem(plan.uuid, combo.uuid, item.uuid));
        } catch (err: any) {
          logger.error('Error deleting corrugator lane:', err);
          setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
        }
      },
    });
  };

  const setPlannedSheets = async (combo: CorrugatorPlanCombination, item: CorrugatorPlanItem, value: number) => {
    setActionError(null);
    try {
      setPlan(await corrugatorPlansApi.setItemPlannedSheets(plan.uuid, combo.uuid, item.uuid, value));
    } catch (err: any) {
      logger.error('Error updating corrugator lane planned sheets:', err);
      setActionError(err?.response?.data?.message || t('corrugatorPlan.updateFailed'));
    }
  };

  const numberField = (key: (typeof PARAM_MAIN_KEYS)[number] | (typeof PARAM_ADVANCED_KEYS)[number]) => (
    <div key={key}>
      <label className="gd-label">{t(`corrugatorPlan.params.${key}`)}</label>
      <input
        type="number"
        step="any"
        className="input-field w-full"
        disabled={paramsDisabled}
        value={paramsDraft ? (paramsDraft[key] as number) : 0}
        onChange={(e) => paramsDraft && setParamsDraft({ ...paramsDraft, [key]: Number(e.target.value) })}
        data-testid={`param-${key}`}
      />
    </div>
  );

  const boolField = (key: 'rotation' | 'toleranceQuantities') => (
    <label key={key} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        disabled={paramsDisabled}
        checked={paramsDraft ? !!paramsDraft[key] : false}
        onChange={(e) => paramsDraft && setParamsDraft({ ...paramsDraft, [key]: e.target.checked })}
        data-testid={`param-${key}`}
      />
      {t(`corrugatorPlan.params.${key}`)}
    </label>
  );

  const hasFulfillment = (plan.orders ?? []).some((o) => o.state);

  // D-44: every reel width offered by every machine on the plan, so a
  // combination can be moved to a different (machine, width) pair.
  const reelWidthOptions = plan.machines.flatMap((m) =>
    (m.widths.length ? m.widths : [m.width]).map((w) => ({
      value: `${m.machineUuid}:${w}`,
      label: `${m.code || m.description || m.machineUuid} · ${w} mm`,
    })),
  );

  return (
    <Layout>
      <div className="space-y-6" data-testid="corrugator-plan">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="gd-page-title">
              {plan.name || t('corrugatorPlan.untitled')} — #{plan.number}
            </h1>
            <p className="text-secondary-600">
              {plan.board.fluteTypes.join(' / ')}
              {plan.board.paperClasses.length > 0 && ` · ${plan.board.paperClasses.map((p) => p.code).join(', ')}`}
            </p>
            <StatusPill status={plan.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (plan.status === 'draft' || plan.status === 'failed') && (
              <Button onClick={handleSolve} data-testid="solve-btn">
                <Play className="mr-1 h-4 w-4" />{t('corrugatorPlan.solve')}
              </Button>
            )}
            {canEdit && plan.status === 'solved' && (
              <Button variant="secondary" onClick={handleSolve} data-testid="resolve-btn">
                <Play className="mr-1 h-4 w-4" />{t('corrugatorPlan.resolve')}
              </Button>
            )}
            {canEdit && plan.status === 'solving' && (
              <Button variant="danger" onClick={handleCancelSolve} data-testid="cancel-solve-btn">
                <XCircle className="mr-1 h-4 w-4" />{t('corrugatorPlan.cancelSolve')}
              </Button>
            )}
            {canRegister && plan.status === 'solved' && (
              <Button onClick={() => doRegister(false)} data-testid="register-btn">
                <Factory className="mr-1 h-4 w-4" />{t('corrugatorPlan.register')}
              </Button>
            )}
            {canRegister && plan.status === 'registered' && (
              <Button variant="secondary" onClick={handleUnregister} data-testid="unregister-btn">
                <Undo2 className="mr-1 h-4 w-4" />{t('corrugatorPlan.unregister')}
              </Button>
            )}
            <Button variant="outline" onClick={() => window.open(`/corrugator-plans/${plan.uuid}/print`, '_blank')} data-testid="print-btn">
              <Printer className="mr-1 h-4 w-4" />{t('corrugatorPlan.print')}
            </Button>
            {canEdit && !locked && (
              <Button variant="danger" onClick={handleDeletePlan} data-testid="delete-plan-btn">
                <Trash2 className="mr-1 h-4 w-4" />{t('common.delete')}
              </Button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="corrugator-plan-action-error">
            {actionError}
          </div>
        )}

        {plan.status === 'solving' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="solving-progress">
            <p className="text-sm text-amber-800">{t('corrugatorPlan.solving', { seconds: elapsedSeconds })}</p>
            <Skeleton lines={4} className="mt-2" />
          </div>
        )}

        {registerConflict && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4" data-testid="register-conflict">
            <p className="text-sm font-medium text-red-800">{registerConflict.message}</p>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {registerConflict.orders.map((o, idx) => (
                <li key={(o.uuid as string) ?? idx}>
                  {String(o.number ?? o.uuid)}
                  {registerConflict.code === 'STALE_PENDING' &&
                    ` — ${t('corrugatorPlan.pendingWas', { was: String(o.pendingSheets), now: String(o.pendingNow) })}`}
                  {registerConflict.code === 'OVER_ALLOCATED' &&
                    ` — ${t('corrugatorPlan.plannedOverLimit', { planned: String(o.planned), limit: String(o.limit) })}`}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="danger" onClick={() => doRegister(true)} data-testid="register-force-btn">
                {t('corrugatorPlan.force')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRegisterConflict(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        <Card
          title={t('corrugatorPlan.machinesTitle')}
          actions={
            canMutate && (
              <Button size="sm" variant="ghost" onClick={() => setMachinesEditorOpen((open) => !open)} data-testid="edit-machines-btn">
                {machinesEditorOpen ? t('common.cancel') : t('common.edit')}
              </Button>
            )
          }
        >
          {!machinesEditorOpen ? (
            <div className="flex flex-wrap gap-2">
              {plan.machines.map((m) => (
                <span key={m.machineUuid} className="rounded-full bg-secondary-100 px-3 py-1 text-sm text-secondary-700">
                  {m.code || m.description || m.machineUuid}: {(m.widths.length ? m.widths : [m.width]).join(', ')} mm
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <MachineWidthsPicker machines={corrugatorMachines} selected={machineSelection} onChange={setMachineSelection} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMachinesEditorOpen(false)}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={saveMachines} data-testid="save-machines-btn">{t('common.save')}</Button>
              </div>
            </div>
          )}
        </Card>

        <Card title={t('corrugatorPlan.parametersTitle')}>
          {paramsDraft && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PARAM_MAIN_KEYS.map((key) => numberField(key))}
                {boolField('rotation')}
                {boolField('toleranceQuantities')}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                onClick={() => setParamsOpen((open) => !open)}
                data-testid="params-advanced-toggle"
              >
                {t('corrugatorPlan.advanced')}
                {paramsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {paramsOpen && (
                <div className="space-y-3 border-t border-secondary-200 pt-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PARAM_ADVANCED_KEYS.map((key) => numberField(key))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {CONSTRAINT_KEYS.map((key) => (
                      <label key={key} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          disabled={paramsDisabled}
                          checked={paramsDraft.constraints[key]}
                          onChange={(e) =>
                            setParamsDraft({ ...paramsDraft, constraints: { ...paramsDraft.constraints, [key]: e.target.checked } })
                          }
                          data-testid={`param-constraint-${key}`}
                        />
                        {t(`corrugatorPlan.constraints.${key}`)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {!paramsDisabled && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveParameters} data-testid="save-parameters-btn">{t('corrugatorPlan.saveParameters')}</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          title={t('corrugatorPlan.ordersTitle')}
          actions={
            canMutate && (
              <Button size="sm" variant="ghost" onClick={() => setAddOrdersOpen(true)} data-testid="add-orders-btn">
                <Plus className="mr-1 h-3.5 w-3.5" />{t('corrugatorPlan.addOrders')}
              </Button>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="gd-table min-w-full">
              <thead>
                <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500">
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.number')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.product')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.requestedSheets')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.sheetsPerUnit')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.priority')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.partial')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.rotation')}</th>
                  <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.pending')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {(plan.orders ?? []).map((order) => (
                  <tr key={order.uuid} data-testid={`plan-order-${order.uuid}`}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-secondary-900">{order.productionOrder.number}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.productCode}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        defaultValue={order.requestedSheets}
                        disabled={!canMutate}
                        className="w-24 rounded border border-secondary-300 px-2 py-1 text-sm"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 1 && v !== order.requestedSheets) updateOrderField(order, { requestedSheets: v });
                        }}
                        data-testid={`order-requested-sheets-${order.uuid}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <input
                        type="number"
                        min={0.0001}
                        step="any"
                        defaultValue={order.sheetsPerUnit}
                        disabled={!canMutate}
                        className="w-20 rounded border border-secondary-300 px-2 py-1 text-sm"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v > 0 && v !== order.sheetsPerUnit) updateOrderField(order, { sheetsPerUnit: v });
                        }}
                        data-testid={`order-sheets-per-unit-${order.uuid}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <select
                        className="rounded border border-secondary-300 px-2 py-1 text-sm"
                        defaultValue={order.priority}
                        disabled={!canMutate}
                        onChange={(e) => updateOrderField(order, { priority: e.target.value })}
                        data-testid={`order-priority-${order.uuid}`}
                      >
                        <option value="normal">{t('corrugatorPlan.priority.normal')}</option>
                        <option value="mandatory">{t('corrugatorPlan.priority.mandatory')}</option>
                        <option value="optional">{t('corrugatorPlan.priority.optional')}</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={order.partialProduction}
                        disabled={!canMutate}
                        onChange={(e) => updateOrderField(order, { partialProduction: e.target.checked })}
                        data-testid={`order-partial-${order.uuid}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={order.allowsRotation}
                        disabled={!canMutate}
                        onChange={(e) => updateOrderField(order, { allowsRotation: e.target.checked })}
                        data-testid={`order-rotation-${order.uuid}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.pendingSheets}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {canMutate && (
                        <ActionButton label={t('corrugatorPlan.removeOrder')} tone="danger" onClick={() => removeOrder(order)} data-testid={`remove-order-${order.uuid}`}>
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {plan.summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" data-testid="kpi-strip">
            <Kpi label={t('corrugatorPlan.kpi.totalMeters')} value={`${plan.summary.totalMeters} m`} />
            <Kpi label={t('corrugatorPlan.kpi.averageRefile')} value={`${plan.summary.averageRefile.toFixed(2)}%`} />
            <Kpi label={t('corrugatorPlan.kpi.averageFullRefile')} value={`${plan.summary.averageFullRefile.toFixed(2)}%`} />
            <Kpi label={t('corrugatorPlan.kpi.averageTrim')} value={`${plan.summary.averageTrim.toFixed(1)} mm`} />
            <Kpi label={t('corrugatorPlan.kpi.scrapKg')} value={plan.summary.scrapKg != null ? `${plan.summary.scrapKg.toFixed(1)} kg` : '-'} />
            <Kpi label={t('corrugatorPlan.kpi.averageFulfillment')} value={`${plan.summary.averageFulfillment.toFixed(1)}%`} />
            <Kpi
              label={t('corrugatorPlan.kpi.states')}
              value={`${plan.summary.complete}/${plan.summary.partial}/${plan.summary.empty}/${plan.summary.exceeded}`}
            />
          </div>
        )}

        {hasFulfillment && (
          <Card title={t('corrugatorPlan.fulfillmentTitle')}>
            <div className="overflow-x-auto">
              <table className="gd-table min-w-full">
                <thead>
                  <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500">
                    <th className="px-3 py-2">{t('corrugatorPlan.ordersColumns.number')}</th>
                    <th className="px-3 py-2">{t('corrugatorPlan.fulfillmentColumns.lowerBound')}</th>
                    <th className="px-3 py-2">{t('corrugatorPlan.fulfillmentColumns.upperBound')}</th>
                    <th className="px-3 py-2">{t('corrugatorPlan.fulfillmentColumns.planned')}</th>
                    <th className="px-3 py-2">{t('corrugatorPlan.fulfillmentColumns.percentage')}</th>
                    <th className="px-3 py-2">{t('corrugatorPlan.fulfillmentColumns.state')}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {(plan.orders ?? []).map((order) => (
                    <tr key={order.uuid} data-testid={`fulfillment-${order.uuid}`}>
                      <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-secondary-900">{order.productionOrder.number}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.lowerBound ?? '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.upperBound ?? '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.plannedSheets ?? 0}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">
                        {order.fulfillment != null ? `${order.fulfillment.toFixed(1)}%` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2"><FulfillmentPill state={order.state} /></td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {canEdit && plan.status === 'solved' && (
                          <ActionButton
                            label={t('corrugatorPlan.addCombination')}
                            onClick={() => setAddCombinationFor(order)}
                            data-testid={`add-combination-for-${order.uuid}`}
                          >
                            <Plus className="h-4 w-4" />
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {plan.status !== 'solving' && plan.solve?.status && plan.solve.status !== 'ok' && (
          <div
            role="status"
            data-testid="solve-outcome"
            className={`rounded-lg border px-4 py-3 text-sm ${
              plan.solve.status === 'time-limit' || plan.solve.status === 'cancelled'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {t(`corrugatorPlan.solveOutcome.${plan.solve.status}`)}
          </div>
        )}

        <Card title={t('corrugatorPlan.combinationsTitle')}>
          {!plan.combinations || plan.combinations.length === 0 ? (
            <p className="text-sm text-secondary-500" data-testid="no-combinations">{t('corrugatorPlan.noCombinations')}</p>
          ) : (
            Array.from(combosByMachine.entries()).map(([machineUuid, combos]) => {
              const snapshot = plan.machines.find((m) => m.machineUuid === machineUuid);
              return (
                <div key={machineUuid} className="mb-6 last:mb-0">
                  <h3 className="mb-2 text-sm font-semibold text-secondary-900">{snapshot?.code || snapshot?.description || machineUuid}</h3>
                  <div className="space-y-3">
                    {combos.map((combo, index) => (
                      <div key={combo.uuid} className="rounded-lg border border-secondary-200 p-3" data-testid={`combination-${combo.uuid}`}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-medium text-secondary-900">#{combo.sequence}</span>
                            <select
                              className="rounded border border-secondary-300 px-1 py-0.5 text-xs"
                              value={combo.machineKey}
                              disabled={!canMutate}
                              onChange={(e) => setMachineKey(combo, e.target.value)}
                              data-testid={`combination-machine-key-${combo.uuid}`}
                            >
                              {reelWidthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-1 text-secondary-600">
                              {t('corrugatorPlan.meters')}:
                              <input
                                type="number"
                                min={0}
                                defaultValue={combo.meters}
                                disabled={!canMutate}
                                className="w-20 rounded border border-secondary-300 px-1 py-0.5"
                                onBlur={(e) => {
                                  const v = Number(e.target.value);
                                  if (!Number.isNaN(v) && v !== combo.meters) setMeters(combo, v);
                                }}
                                data-testid={`combination-meters-${combo.uuid}`}
                              />
                            </label>
                            <span className="text-secondary-500">{t('corrugatorPlan.trim')}: {combo.trim} mm</span>
                            <span className="text-secondary-500">{t('corrugatorPlan.refile')}: {combo.refile.toFixed(2)}%</span>
                          </div>
                          {canMutate && (
                            <div className="flex items-center gap-1">
                              <ActionButton label={t('corrugatorPlan.moveUp')} disabled={index === 0} onClick={() => moveSequence(combo, -1)} data-testid={`move-up-${combo.uuid}`}>
                                <ChevronUp className="h-4 w-4" />
                              </ActionButton>
                              <ActionButton
                                label={t('corrugatorPlan.moveDown')}
                                disabled={index === combos.length - 1}
                                onClick={() => moveSequence(combo, 1)}
                                data-testid={`move-down-${combo.uuid}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </ActionButton>
                              <ActionButton label={t('corrugatorPlan.deleteCombination')} tone="danger" onClick={() => deleteCombination(combo)} data-testid={`delete-combination-${combo.uuid}`}>
                                <Trash2 className="h-4 w-4" />
                              </ActionButton>
                            </div>
                          )}
                        </div>
                        {moveErrors[combo.uuid] && (
                          <p className="mb-2 text-xs text-red-600" data-testid={`combination-move-error-${combo.uuid}`}>
                            {moveErrors[combo.uuid]}
                          </p>
                        )}
                        <LaneDiagram
                          reelWidth={combo.width}
                          machineTrim={snapshot?.trim ?? 0}
                          transversalRefile={combo.transversalRefile}
                          lanes={combo.items.map((item) => ({
                            key: item.uuid,
                            orderNumber: item.order.number,
                            runWidth: item.runWidth,
                            count: item.count,
                            rotated: item.rotated,
                          }))}
                          data-testid={`lane-diagram-${combo.uuid}`}
                        />
                        <div className="mt-2 space-y-1">
                          {combo.items.map((item) => (
                            <div key={item.uuid} className="flex flex-wrap items-center justify-between gap-2 text-xs text-secondary-600" data-testid={`combination-item-${item.uuid}`}>
                              <span>
                                {item.order.number} — {item.count} × {item.runWidth} mm {item.rotated ? `(${t('corrugatorPlan.rotated')})` : ''}
                              </span>
                              <span className="flex items-center gap-2">
                                {t('corrugatorPlan.plannedSheets')}:
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={item.plannedSheets}
                                  disabled={!canMutate}
                                  className="w-20 rounded border border-secondary-300 px-1 py-0.5"
                                  onBlur={(e) => {
                                    const v = Number(e.target.value);
                                    if (!Number.isNaN(v) && v !== item.plannedSheets) setPlannedSheets(combo, item, v);
                                  }}
                                  data-testid={`item-planned-sheets-${item.uuid}`}
                                />
                                {canMutate && (
                                  <ActionButton label={t('corrugatorPlan.deleteLane')} tone="danger" onClick={() => deleteItem(combo, item)} data-testid={`delete-item-${item.uuid}`}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </ActionButton>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {addCombinationFor && (
        <AddCombinationModal
          isOpen={!!addCombinationFor}
          onClose={() => setAddCombinationFor(null)}
          plan={plan}
          order={addCombinationFor}
          onAdded={(updated) => {
            setPlan(updated);
            setAddCombinationFor(null);
          }}
        />
      )}
      {addOrdersOpen && (
        <AddOrdersFromPoolModal
          isOpen={addOrdersOpen}
          onClose={() => setAddOrdersOpen(false)}
          plan={plan}
          onAdded={() => {
            setAddOrdersOpen(false);
            fetchPlan();
          }}
        />
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
    </Layout>
  );
};

export default CorrugatorPlan;
