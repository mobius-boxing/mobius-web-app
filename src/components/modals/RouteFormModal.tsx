import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createProductionRouteSchema } from '../../validation/schemas/productionRoute';
import { firstIssue } from '../../validation/formErrors';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  ProductionRoute,
  RouteStage,
  MachineType,
  Machine,
  StageSupplyType,
} from '../../types';
import {
  productionRoutesApi,
  machineTypesApi,
  machinesApi,
  paperSuppliesApi,
  paperSheetsApi,
  consumableSuppliesApi,
  toolingsApi,
  finishedGoodsApi,
} from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** null = create; a route (list row) = edit — the full tree is fetched on open. */
  route: ProductionRoute | null;
}

interface SupplyOption {
  uuid: string;
  label: string;
}

const SUPPLY_TYPES: StageSupplyType[] = ['paper', 'sheet', 'consumable', 'tooling', 'finishedGood'];

const emptyStage = (number: number): RouteStage => ({
  clientId: crypto.randomUUID(),
  number,
  description: '',
  isCorrugation: false,
  setupTimeMinutes: 0,
  machineTypeUuid: '',
  machines: [],
  supplies: [],
});

/**
 * Shared create/edit route modal with the stages editor (Guille's "Clone
 * Route" flows live on the list page; this is the anatomy editor).
 * Single component for both modes — the stages tree is too rich to duplicate
 * across a Create/Edit modal pair (deviation from the small-lookup pattern).
 */
const RouteFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, route }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();

  const [name, setName] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<RouteStage[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [machinesByType, setMachinesByType] = useState<Record<string, Machine[]>>({});
  const [supplyOptions, setSupplyOptions] = useState<Record<StageSupplyType, SupplyOption[]>>({
    paper: [], sheet: [], consumable: [], tooling: [], finishedGood: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  // Dirty guard: snapshot of the loaded form; compared on close.
  const snapshotRef = useRef<string>('');
  const snap = (n: string, g: boolean, a: boolean, d: boolean, st: RouteStage[]) =>
    JSON.stringify({ n, g, a, d, st });

  const requestClose = () => {
    if (
      snapshotRef.current &&
      snap(name, isGlobal, active, isDefault, stages) !== snapshotRef.current &&
      !window.confirm(t('common.discardChanges'))
    )
      return;
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setWarnings([]);
    const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};

    machineTypesApi
      .getMachineTypes({ limit: 100, ...companyFilter })
      .then((r) => setMachineTypes(r.data))
      .catch((err) => logger.error('Error fetching machine types:', err));

    const loaders: Array<[StageSupplyType, Promise<any>]> = [
      ['paper', paperSuppliesApi.getPaperSupplies({ limit: 100, ...companyFilter })],
      ['sheet', paperSheetsApi.getPaperSheets({ limit: 100, ...companyFilter })],
      ['consumable', consumableSuppliesApi.getConsumableSupplies({ limit: 100, ...companyFilter })],
      ['tooling', toolingsApi.getToolings({ limit: 100, ...companyFilter })],
      ['finishedGood', finishedGoodsApi.getFinishedGoods({ limit: 100, ...companyFilter })],
    ];
    Promise.all(loaders.map(([, p]) => p.catch(() => ({ data: [] }))))
      .then((results) => {
        const next: Record<StageSupplyType, SupplyOption[]> = {
          paper: [], sheet: [], consumable: [], tooling: [], finishedGood: [],
        };
        results.forEach((r: any, i) => {
          next[loaders[i][0]] = (r.data ?? []).map((s: any) => ({
            uuid: s.uuid,
            label: s.code ? `${s.code} — ${s.name ?? ''}` : (s.name ?? s.uuid),
          }));
        });
        setSupplyOptions(next);
      })
      .catch((err) => logger.error('Error fetching supply options:', err));

    if (route) {
      productionRoutesApi
        .getRoute(route.uuid)
        .then((full) => {
          setName(full.name);
          setIsGlobal(full.isGlobal);
          setActive(full.active);
          setIsDefault(full.isDefault);
          const mappedStages: RouteStage[] = (full.stages ?? []).map((stage) => ({
              ...stage,
              clientId: stage.uuid ?? crypto.randomUUID(),
              machineTypeUuid: stage.machineType?.uuid ?? '',
              machines: stage.machines.map((m) => ({
                clientId: crypto.randomUUID(),
                machineUuid: m.machine?.uuid,
                isPrimary: m.isPrimary,
                machine: m.machine,
              })),
              supplies: stage.supplies.map((s) => ({
                ...s,
                clientId: crypto.randomUUID(),
                supplyUuid: s.supply?.uuid,
              })),
            }));
          setStages(mappedStages);
          snapshotRef.current = snap(full.name, full.isGlobal, full.active, full.isDefault, mappedStages);
        })
        .catch((err) => {
          logger.error('Error fetching route:', err);
          setError(t('productionRoutes.errors.loadFailed'));
        });
    } else {
      setName('');
      setIsGlobal(true);
      setActive(true);
      setIsDefault(false);
      setStages([]);
      snapshotRef.current = snap('', true, true, false, []);
    }
  }, [isOpen, route, effectiveCompanyId, t]);

  const loadMachinesFor = (machineTypeUuid: string) => {
    if (!machineTypeUuid || machinesByType[machineTypeUuid]) return;
    machinesApi
      .getMachines({
        limit: 100,
        machineTypeUuid,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      })
      .then((r) => setMachinesByType((prev) => ({ ...prev, [machineTypeUuid]: r.data })))
      .catch((err) => logger.error('Error fetching machines:', err));
  };

  const patchStage = (index: number, patch: Partial<RouteStage>) =>
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const moveStage = (index: number, delta: number) =>
    setStages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, number: i + 1 }));
    });

  const removeStage = (index: number) =>
    setStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, number: i + 1 })));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Pattern B: `useState` form, so the schema runs here. `stages` stays out
    // of it — see the schema header.
    const problem = firstIssue(createProductionRouteSchema(t), {
      name,
      isGlobal,
      active,
      isDefault,
    });
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError(null);
    setWarnings([]);
    const payload = {
      name,
      isGlobal,
      active,
      isDefault,
      companyId: effectiveCompanyId,
      stages: stages.map((stage, i) => ({
        number: i + 1,
        description: stage.description,
        isCorrugation: stage.isCorrugation ?? false,
        setupTimeMinutes: stage.setupTimeMinutes ?? 0,
        machineTypeUuid: stage.machineTypeUuid || undefined,
        machines: stage.machines
          .filter((m) => m.machineUuid)
          .map((m) => ({ machineUuid: m.machineUuid!, isPrimary: m.isPrimary })),
        supplies: stage.supplies
          .filter((s) => s.supplyUuid)
          .map((s) => ({
            direction: s.direction,
            supplyType: s.supplyType,
            supplyUuid: s.supplyUuid!,
            quantity: s.quantity ?? undefined,
            repetitionsWidth: s.repetitionsWidth ?? 1,
            repetitionsLength: s.repetitionsLength ?? 1,
            allowsSimilar: s.allowsSimilar ?? false,
          })),
      })),
    } as any;
    try {
      const result = route
        ? await productionRoutesApi.updateRoute(route.uuid, payload)
        : await productionRoutesApi.createRoute(payload);
      void result;
      onSuccess();
    } catch (err: any) {
      const problems = err?.response?.data?.problems;
      if (Array.isArray(problems) && problems.length) {
        setError(problems.map((p: any) => p.message).join(' '));
      } else {
        setError(err?.response?.data?.message ?? t('productionRoutes.errors.saveFailed'));
      }
      const warns = err?.response?.data?.warnings;
      if (Array.isArray(warns)) setWarnings(warns.map((w: any) => w.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      title={route ? t('productionRoutes.editTitle') : t('productionRoutes.createTitle')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />
        {warnings.length > 0 && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="gd-label">
              {t('productionRoutes.name')} *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
              {t('productionRoutes.global')}
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              {t('productionRoutes.active')}
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              {t('productionRoutes.default')}
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-secondary-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-secondary-200 bg-secondary-50">
            <span className="text-sm font-medium text-secondary-900">
              {t('productionRoutes.stages')} ({stages.length})
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStages((prev) => [...prev, emptyStage(prev.length + 1)])}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('productionRoutes.addStage')}
            </Button>
          </div>

          {stages.length === 0 && (
            <p className="px-4 py-6 text-sm text-secondary-500">{t('productionRoutes.noStages')}</p>
          )}

          {stages.map((stage, index) => (
            <div key={stage.clientId ?? index} className="px-4 py-3 border-b border-secondary-100 last:border-b-0 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-secondary-700 w-8">#{index + 1}</span>
                <Input
                  className="flex-1"
                  placeholder={t('productionRoutes.stageDescription')}
                  value={stage.description ?? ''}
                  onChange={(e) => patchStage(index, { description: e.target.value })}
                />
                <select
                  className="input-field w-56"
                  value={stage.machineTypeUuid ?? ''}
                  onChange={(e) => {
                    patchStage(index, { machineTypeUuid: e.target.value, machines: [] });
                    loadMachinesFor(e.target.value);
                  }}
                >
                  <option value="">{t('productionRoutes.selectMachineType')}</option>
                  {machineTypes.map((mt) => (
                    <option key={mt.uuid} value={mt.uuid}>
                      {mt.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-secondary-700 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={stage.isCorrugation ?? false}
                    onChange={(e) => patchStage(index, { isCorrugation: e.target.checked })}
                  />
                  {t('productionRoutes.corrugationStage')}
                </label>
                <Input
                  type="number"
                  step="any"
                  className="w-24"
                  title={t('productionRoutes.setupTime')}
                  value={stage.setupTimeMinutes ?? 0}
                  onChange={(e) => patchStage(index, { setupTimeMinutes: parseFloat(e.target.value) || 0 })}
                />
                <Button type="button" variant="ghost" size="sm" aria-label={t('productionRoutes.aria.moveStageUp')} onClick={() => moveStage(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" aria-label={t('productionRoutes.aria.moveStageDown')} onClick={() => moveStage(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  aria-label={t('productionRoutes.aria.removeStage')}
                  onClick={() => removeStage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Machines (Participantes): first = primary, rest backups */}
              <div className="pl-10 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-secondary-500 w-24">
                    {t('productionRoutes.machines')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t('productionRoutes.aria.addMachine')}
                    disabled={!stage.machineTypeUuid}
                    onClick={() => {
                      loadMachinesFor(stage.machineTypeUuid!);
                      patchStage(index, {
                        machines: [
                          ...stage.machines,
                          { clientId: crypto.randomUUID(), machineUuid: '', isPrimary: stage.machines.length === 0 },
                        ],
                      });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {stage.machines.map((m, mi) => (
                  <div key={m.clientId ?? mi} className="flex items-center gap-2">
                    <select
                      className="input-field w-64"
                      value={m.machineUuid ?? ''}
                      onChange={(e) =>
                        patchStage(index, {
                          machines: stage.machines.map((mm, i) =>
                            i === mi ? { ...mm, machineUuid: e.target.value } : mm,
                          ),
                        })
                      }
                    >
                      <option value="">{t('productionRoutes.selectMachine')}</option>
                      {(machinesByType[stage.machineTypeUuid ?? ''] ?? []).map((machine) => (
                        <option key={machine.uuid} value={machine.uuid}>
                          {machine.code || machine.description || machine.uuid}
                        </option>
                      ))}
                      {m.machine && !(machinesByType[stage.machineTypeUuid ?? ''] ?? []).some((x) => x.uuid === m.machine?.uuid) && (
                        <option value={m.machine.uuid}>{m.machine.code || m.machine.description}</option>
                      )}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-secondary-700">
                      <input
                        type="radio"
                        name={`primary-${stage.clientId ?? index}`}
                        checked={m.isPrimary}
                        onChange={() =>
                          patchStage(index, {
                            machines: stage.machines.map((mm, i) => ({ ...mm, isPrimary: i === mi })),
                          })
                        }
                      />
                      {t('productionRoutes.primary')}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      aria-label={t('productionRoutes.aria.removeMachine')}
                      onClick={() =>
                        patchStage(index, { machines: stage.machines.filter((_, i) => i !== mi) })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Supplies (Inputs/Outputs) */}
              <div className="pl-10 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-secondary-500 w-24">
                    {t('productionRoutes.supplies')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t('productionRoutes.aria.addSupply')}
                    onClick={() =>
                      patchStage(index, {
                        supplies: [
                          ...stage.supplies,
                          {
                            clientId: crypto.randomUUID(),
                            direction: 'input',
                            supplyType: 'sheet',
                            supplyUuid: '',
                            quantity: null,
                            repetitionsWidth: 1,
                            repetitionsLength: 1,
                            allowsSimilar: false,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {stage.supplies.map((s, si) => (
                  <div key={s.clientId ?? si} className="flex items-center gap-2">
                    <select
                      className="input-field w-28"
                      value={s.direction}
                      onChange={(e) =>
                        patchStage(index, {
                          supplies: stage.supplies.map((ss, i) =>
                            i === si ? { ...ss, direction: e.target.value as any } : ss,
                          ),
                        })
                      }
                    >
                      <option value="input">{t('productionRoutes.input')}</option>
                      <option value="output">{t('productionRoutes.output')}</option>
                    </select>
                    <select
                      className="input-field w-36"
                      value={s.supplyType}
                      onChange={(e) =>
                        patchStage(index, {
                          supplies: stage.supplies.map((ss, i) =>
                            i === si
                              ? { ...ss, supplyType: e.target.value as any, supplyUuid: '' }
                              : ss,
                          ),
                        })
                      }
                    >
                      {SUPPLY_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {t(`productionRoutes.supplyTypes.${st}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input-field flex-1"
                      value={s.supplyUuid ?? ''}
                      onChange={(e) =>
                        patchStage(index, {
                          supplies: stage.supplies.map((ss, i) =>
                            i === si ? { ...ss, supplyUuid: e.target.value } : ss,
                          ),
                        })
                      }
                    >
                      <option value="">{t('productionRoutes.selectSupply')}</option>
                      {supplyOptions[s.supplyType].map((opt) => (
                        <option key={opt.uuid} value={opt.uuid}>
                          {opt.label}
                        </option>
                      ))}
                      {s.supply && !supplyOptions[s.supplyType].some((o) => o.uuid === s.supply?.uuid) && (
                        <option value={s.supply.uuid}>{s.supply.code || s.supply.name}</option>
                      )}
                    </select>
                    <Input
                      type="number"
                      step="any"
                      className="w-24"
                      placeholder={t('productionRoutes.quantity')}
                      value={s.quantity ?? ''}
                      onChange={(e) =>
                        patchStage(index, {
                          supplies: stage.supplies.map((ss, i) =>
                            i === si
                              ? { ...ss, quantity: e.target.value === '' ? null : parseFloat(e.target.value) }
                              : ss,
                          ),
                        })
                      }
                    />
                    <label className="flex items-center gap-1 text-xs text-secondary-700 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={s.allowsSimilar ?? false}
                        onChange={(e) =>
                          patchStage(index, {
                            supplies: stage.supplies.map((ss, i) =>
                              i === si ? { ...ss, allowsSimilar: e.target.checked } : ss,
                            ),
                          })
                        }
                      />
                      {t('productionRoutes.allowsSimilar')}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      aria-label={t('productionRoutes.aria.removeSupply')}
                      onClick={() =>
                        patchStage(index, { supplies: stage.supplies.filter((_, i) => i !== si) })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ModalFooter
          onCancel={requestClose}
          loading={loading}
          submitText={route ? t('productionRoutes.editButton') : t('productionRoutes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default RouteFormModal;
