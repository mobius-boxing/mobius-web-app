import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import PartApprovalControl from '../parts/PartApprovalControl';
import FileRefUploader from '../ui/FileRefUploader';
import { Part, PartFormPayload } from '../../types';
import {
  partsApi,
  corrugationsApi,
  productionRoutesApi,
  palletizationsApi,
  flapTypesApi,
  glueTypesApi,
  strappingTypesApi,
  traceTypesApi,
  complementsApi,
} from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productUuid: string;
  /** null = create */
  part: Part | null;
}

type Options = { uuid: string; label: string }[];

const num = (v: any): number | undefined => (v === '' || v == null ? undefined : Number(v));

/**
 * Flatten a loaded Part into form state: every FK becomes its scalar uuid and
 * nested objects NEVER enter the form — one source of truth per field (the
 * nested/scalar duality caused two real binding bugs).
 */
const partToForm = (p: Part): Record<string, any> => {
  const {
    corrugation,
    productionRoute,
    palletization,
    flapType,
    glueType,
    strappingType,
    traceType,
    complement,
    product,
    ...scalars
  } = p as any;
  return {
    ...scalars,
    corrugationUuid: corrugation?.uuid,
    productionRouteUuid: productionRoute?.uuid,
    palletizationUuid: palletization?.uuid,
    flapTypeUuid: flapType?.uuid,
    glueTypeUuid: glueType?.uuid,
    strappingTypeUuid: strappingType?.uuid,
    traceTypeUuid: traceType?.uuid,
    complementUuid: complement?.uuid,
  };
};

/**
 * Per-edited-field cascade outputs (mirror of the backend PartCalculator's
 * applyEdit). Only these keys are merged from a cascade response — merging the
 * whole part would clobber sibling fields the user is still editing.
 */
const CASCADE_DERIVED: Record<string, string[]> = {
  boxLength: ['boxLength', 'externalLength'],
  boxWidth: ['boxWidth', 'externalWidth'],
  boxHeight: ['boxHeight', 'externalHeight'],
  externalLength: ['externalLength', 'boxLength'],
  externalWidth: ['externalWidth', 'boxWidth'],
  externalHeight: ['externalHeight', 'boxHeight'],
  boxSurface: ['boxSurface', 'boxWeight'],
  grammage: ['grammage', 'boxWeight'],
};

/** Attributes server validation messages to a tab index (cheap keyword map). */
const FIELD_TAB_HINTS: Array<{ pattern: RegExp; tab: number }> = [
  { pattern: /corrugation|box(length|width|height)|sheet|grammage|score|surface/i, tab: 1 },
  { pattern: /route|ruta/i, tab: 2 },
  { pattern: /tolerance|overrun|underrun|flap|glue|strapping|trace|complement/i, tab: 3 },
  { pattern: /palletiz/i, tab: 4 },
];

/**
 * 7-tab Part form (14-ui-form.md). Statistics tab is a placeholder.
 * Create: no live cascade (server computes on save + subsequent edits).
 * Edit: dimension fields cascade on blur via PATCH /parts/:uuid/cascade.
 */
const PartFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, productUuid, part }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const isEdit = !!part;
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState<Part | null>(part);
  const [error, setError] = useState<string | null>(null);
  const [errorTab, setErrorTab] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [opts, setOpts] = useState<Record<string, Options>>({});
  // Dirty guard + cascade coordination (no state — render-independent).
  const initialFormRef = useRef<string>('');
  const cascadeSeqRef = useRef(0);
  const pendingCascadeRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab(0);
    setError(null);
    setErrorTab(null);
    setCurrent(part);
    const initial = part ? partToForm(part) : { symmetricScoreLines: false };
    setForm(initial);
    initialFormRef.current = JSON.stringify(initial);
    const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
    (async () => {
      try {
        const [corr, routes, pallets, flaps, glues, straps, traces, comps] = await Promise.all([
          corrugationsApi.getCorrugations({ limit: 100, ...companyFilter }),
          productionRoutesApi.getRoutes({ limit: 100, isGlobal: 'true', ...companyFilter }),
          palletizationsApi.getPalletizations({ limit: 100, ...companyFilter }),
          flapTypesApi.getFlapTypes({ limit: 100, ...companyFilter }),
          glueTypesApi.getGlueTypes({ limit: 100, ...companyFilter }),
          strappingTypesApi.getStrappingTypes({ limit: 100, ...companyFilter }),
          traceTypesApi.getTraceTypes({ limit: 100, ...companyFilter }),
          complementsApi.getComplements({ limit: 100, ...companyFilter }),
        ]);
        setOpts({
          corrugation: corr.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          route: routes.data.map((x: any) => ({ uuid: x.uuid, label: x.name })),
          palletization: pallets.data.map((x: any) => ({ uuid: x.uuid, label: x.name ?? x.code })),
          flapType: flaps.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          glueType: glues.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          strappingType: straps.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          traceType: traces.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          complement: comps.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
        });
      } catch (err) {
        logger.error('Error loading part form options:', err);
      }
    })();
  }, [isOpen, part, effectiveCompanyId]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const isDirty = () => JSON.stringify(form) !== initialFormRef.current;

  const requestClose = () => {
    if (isDirty() && !window.confirm(t('common.discardChanges'))) return;
    onClose();
  };

  const cascadeBlur = (field: string) => {
    if (!isEdit || !current) return;
    const seq = ++cascadeSeqRef.current;
    const run = (async () => {
      try {
        const updated = await partsApi.cascade(current.uuid, field, num(form[field]) ?? null);
        // A newer blur or an in-flight save supersedes this response.
        if (!updated || seq !== cascadeSeqRef.current) return;
        setCurrent(updated);
        // Merge ONLY the fields this cascade owns — never the whole part,
        // which would clobber sibling fields still being edited.
        const derived = CASCADE_DERIVED[field] ?? [field];
        setForm((f) => {
          const next = { ...f };
          for (const key of derived) next[key] = (updated as any)[key];
          return next;
        });
      } catch (err) {
        logger.error('Cascade failed:', err);
      }
    })();
    pendingCascadeRef.current = run;
  };

  const submit = async () => {
    try {
      setSaving(true);
      setError(null);
      setErrorTab(null);
      // Let any in-flight cascade settle, then invalidate stragglers so their
      // responses can't rewrite form state after we've read it.
      if (pendingCascadeRef.current) await pendingCascadeRef.current.catch(() => {});
      cascadeSeqRef.current++;
      const payload: PartFormPayload = {
        description: form.description,
        clientCode: form.clientCode,
        // Flat form state: the scalar uuids are the only source of truth.
        corrugationUuid: form.corrugationUuid,
        productionRouteUuid: form.productionRouteUuid ?? undefined,
        palletizationUuid: form.palletizationUuid,
        flapTypeUuid: form.flapTypeUuid,
        glueTypeUuid: form.glueTypeUuid,
        strappingTypeUuid: form.strappingTypeUuid,
        traceTypeUuid: form.traceTypeUuid,
        complementUuid: form.complementUuid,
      };
      for (const key of [
        'boxLength','boxWidth','boxHeight','externalLength','externalWidth','externalHeight',
        'sheetLength','sheetWidth','additionalSheetLength','preferredWidth',
        'flap','lowerFlap','upperFlap','flapOverlap','colorCount','printSides','labelsPerPallet',
        'compressionTest','burstTest','cobbTest','ect','grammage',
        'lengthUpperTolerance','lengthLowerTolerance','widthUpperTolerance','widthLowerTolerance',
        'overrunPercentage','underrunPercentage','corrugationOverproduction',
        'boxSurface','averageWeight','associatedQuantity',
      ]) payload[key] = num(form[key]);
      for (const key of [
        'corrugationScoreLines','printScoreLines','inks','labelText','claspClosure',
        'foodSafetyNumber','blueprintRef','notes','quotingNotes',
      ]) if (form[key] !== undefined) payload[key] = form[key];
      for (const key of [
        'symmetricScoreLines','printCode','printDate','printRecyclable','printWarranty','printLogo',
        'printNationalIndustry','printExport','allowsRotation','allowsPartialRotation',
        'mandatoryRotation','allowsGluing',
      ]) if (form[key] !== undefined) payload[key] = !!form[key];
      for (const key of ['dataSheetFileUuid','sketchFileUuid','blueprintFileUuid','imageFileUuid'])
        if (form[key] !== undefined) payload[key] = form[key];

      if (isEdit && current) {
        await partsApi.updatePart(current.uuid, payload);
      } else {
        payload.productUuid = productUuid;
        await partsApi.createPart(payload);
      }
      onSuccess();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? t('parts.form.saveError');
      setError(message);
      // Cheap field→tab attribution so the user isn't hunting across 7 tabs.
      const hint = FIELD_TAB_HINTS.find((h) => h.pattern.test(String(message)));
      setErrorTab(hint ? hint.tab : null);
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () => ['general', 'production', 'route', 'parameters', 'palletization', 'otherData', 'statistics'],
    [],
  );

  const numInput = (key: string, cascade = false) => (
    <input
      type="number"
      className="input-field w-full"
      value={form[key] ?? ''}
      onChange={(e) => set(key, e.target.value)}
      onBlur={cascade ? () => cascadeBlur(key) : undefined}
    />
  );
  const textInput = (key: string, pattern?: string) => (
    <input
      type="text"
      className="input-field w-full"
      pattern={pattern}
      value={form[key] ?? ''}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const check = (key: string) => (
    <label className="flex items-center gap-2 text-sm text-secondary-700">
      <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} />
      {t(`parts.fields.${key}`)}
    </label>
  );
  // Flat form state: the scalar uuid under `key` is the single source of truth.
  const select = (key: string, optKey: string) => (
    <select
      className="input-field w-full"
      value={form[key] ?? ''}
      onChange={(e) => set(key, e.target.value || undefined)}
    >
      <option value="">{t('parts.form.none')}</option>
      {(opts[optKey] ?? []).map((o) => (
        <option key={o.uuid} value={o.uuid}>{o.label}</option>
      ))}
    </select>
  );
  const field = (labelKey: string, control: React.ReactNode) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-secondary-700">
        {t(`parts.fields.${labelKey}`)}
      </label>
      {control}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={requestClose} title={isEdit ? t('parts.editPart') : t('parts.addPart')} size="xl">
      <div className="mb-4 flex flex-wrap gap-1 border-b border-secondary-200">
        {tabs.map((tKey, i) => (
          <button
            key={tKey}
            className={`relative px-3 py-2 text-sm ${tab === i ? 'border-b-2 border-primary-600 font-medium text-primary-700' : 'text-secondary-500'}`}
            onClick={() => setTab(i)}
            type="button"
          >
            {t(`parts.tabs.${tKey}`)}
            {errorTab === i && (
              <span
                className="absolute right-0 top-1 h-2 w-2 rounded-full bg-red-500"
                aria-label={t('parts.form.tabHasError')}
              />
            )}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} />}

      {tab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('code', <input className="input-field w-full bg-secondary-50" value={current?.code ?? t('parts.form.autoCode')} disabled />)}
            {field('clientCode', textInput('clientCode'))}
          </div>
          {field('description', textInput('description'))}
          {isEdit && current ? (
            <div className="space-y-2">
              <PartApprovalControl part={current} machine="dimensions" onChanged={setCurrent} />
              <PartApprovalControl part={current} machine="technical" onChanged={setCurrent} />
              <PartApprovalControl part={current} machine="part" onChanged={setCurrent} />
            </div>
          ) : (
            <p className="text-sm text-secondary-500">{t('parts.form.approvalsAfterSave')}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {field('dataSheetFile', <FileRefUploader value={form.dataSheetFileUuid ?? null} onChange={(u) => set('dataSheetFileUuid', u)} />)}
            {field('sketchFile', <FileRefUploader value={form.sketchFileUuid ?? null} onChange={(u) => set('sketchFileUuid', u)} />)}
            {field('blueprintFile', <FileRefUploader value={form.blueprintFileUuid ?? null} onChange={(u) => set('blueprintFileUuid', u)} />)}
            {field('imageFile', <FileRefUploader value={form.imageFileUuid ?? null} onChange={(u) => set('imageFileUuid', u)} />)}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-4">
          {field('corrugation', select('corrugationUuid', 'corrugation'))}
          <div className="grid grid-cols-3 gap-4">
            {field('boxLength', numInput('boxLength', true))}
            {field('boxWidth', numInput('boxWidth', true))}
            {field('boxHeight', numInput('boxHeight', true))}
            {field('externalLength', numInput('externalLength', true))}
            {field('externalWidth', numInput('externalWidth', true))}
            {field('externalHeight', numInput('externalHeight', true))}
            {field('sheetLength', numInput('sheetLength'))}
            {field('sheetWidth', numInput('sheetWidth'))}
            {field('additionalSheetLength', numInput('additionalSheetLength'))}
            {field('flap', numInput('flap'))}
            {field('lowerFlap', numInput('lowerFlap'))}
            {field('upperFlap', numInput('upperFlap'))}
            {field('flapOverlap', numInput('flapOverlap'))}
            {field('grammage', numInput('grammage', true))}
            {field('boxSurface', numInput('boxSurface', true))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('boxWeight', <input className="input-field w-full bg-secondary-50" value={form.boxWeight ?? ''} disabled title={t('parts.form.weightComputed') ?? ''} />)}
            {field('preferredWidth', numInput('preferredWidth'))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('corrugationScoreLines', textInput('corrugationScoreLines', '[0-9., ;]*'))}
            {field('printScoreLines', textInput('printScoreLines', '[0-9., ;]*'))}
          </div>
          {check('symmetricScoreLines')}
          <div className="grid grid-cols-3 gap-4">
            {field('colorCount', numInput('colorCount'))}
            {field('printSides', numInput('printSides'))}
            {field('inks', textInput('inks'))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-4">
          {isEdit && current?.productionRoute && !current.productionRoute.isGlobal && (
            <p className="rounded bg-secondary-50 p-2 text-sm text-secondary-600">
              {t('parts.form.rutaPropiaNotice', { name: current.productionRoute.name })}
            </p>
          )}
          {field('productionRoute', select('productionRouteUuid', 'route'))}
          {!isEdit && <p className="text-sm text-secondary-500">{t('parts.form.rutaPropiaHint')}</p>}
        </div>
      )}

      {tab === 3 && (
        <div className="grid grid-cols-3 gap-4">
          {field('lengthUpperTolerance', numInput('lengthUpperTolerance'))}
          {field('lengthLowerTolerance', numInput('lengthLowerTolerance'))}
          {field('widthUpperTolerance', numInput('widthUpperTolerance'))}
          {field('widthLowerTolerance', numInput('widthLowerTolerance'))}
          {field('overrunPercentage', numInput('overrunPercentage'))}
          {field('underrunPercentage', numInput('underrunPercentage'))}
          {field('corrugationOverproduction', numInput('corrugationOverproduction'))}
          {field('compressionTest', numInput('compressionTest'))}
          {field('burstTest', numInput('burstTest'))}
          {field('cobbTest', numInput('cobbTest'))}
          {field('ect', numInput('ect'))}
          {field('associatedQuantity', numInput('associatedQuantity'))}
          <div className="col-span-3 grid grid-cols-2 gap-2">
            {check('allowsRotation')}
            {check('allowsPartialRotation')}
            {check('mandatoryRotation')}
            {check('allowsGluing')}
          </div>
          {field('flapType', select('flapTypeUuid', 'flapType'))}
          {field('glueType', select('glueTypeUuid', 'glueType'))}
          {field('strappingType', select('strappingTypeUuid', 'strappingType'))}
          {field('traceType', select('traceTypeUuid', 'traceType'))}
          {field('complement', select('complementUuid', 'complement'))}
          {field('claspClosure', textInput('claspClosure'))}
        </div>
      )}

      {tab === 4 && (
        <div className="space-y-4">
          {field('palletization', select('palletizationUuid', 'palletization'))}
          <div className="grid grid-cols-2 gap-4">
            {field('labelsPerPallet', numInput('labelsPerPallet'))}
            {field('labelText', textInput('labelText'))}
          </div>
          {field('notes', <textarea className="input-field w-full" rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />)}
          {field('quotingNotes', <textarea className="input-field w-full" rows={2} value={form.quotingNotes ?? ''} onChange={(e) => set('quotingNotes', e.target.value)} />)}
        </div>
      )}

      {tab === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {check('printCode')}
            {check('printDate')}
            {check('printRecyclable')}
            {check('printWarranty')}
            {check('printLogo')}
            {check('printNationalIndustry')}
            {check('printExport')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('foodSafetyNumber', textInput('foodSafetyNumber'))}
            {field('blueprintRef', textInput('blueprintRef'))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <p className="py-8 text-center text-sm text-secondary-500">{t('parts.tabs.statisticsPlaceholder')}</p>
      )}

      <div className="mt-6 flex justify-end gap-2 border-t border-secondary-200 pt-4">
        <Button variant="secondary" onClick={requestClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('common.save') : t('parts.addPart')}
        </Button>
      </div>
    </Modal>
  );
};

export default PartFormModal;
