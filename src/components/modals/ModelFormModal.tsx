import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, BookOpen, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import FormulaField from '../ui/FormulaField';
import FileRefUploader from '../ui/FileRefUploader';
import FormulaReferenceModal from './FormulaReferenceModal';
import { CreateModelForm, Model } from '../../types';
import { complementsApi, flapTypesApi, modelsApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** null = create */
  model: Model | null;
}

type Options = { uuid: string; label: string }[];

const SCALAR_FORMULA_FIELDS = [
  'sheetLengthFormula',
  'sheetWidthFormula',
  'lowerFlapFormula',
  'upperFlapFormula',
  'boxSurfaceFormula',
  'externalLengthDeltaFormula',
  'externalWidthDeltaFormula',
  'externalHeightDeltaFormula',
] as const;

/** Split a stored pipe-list into editable rows, byte-for-byte per segment. */
const toRows = (stored: string | null | undefined): string[] =>
  stored == null || stored === '' ? [] : stored.split('|');

/**
 * Create/edit modal for box models (Procusto "Datos del modelo"). The two
 * trazadores grids are ORDERED (score-line sequence): rows join with `|`
 * (no surrounding spaces) on save; an empty grid is sent as null, not "".
 */
const ModelFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, model }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const isEdit = !!model;
  const [form, setForm] = useState<Record<string, any>>({});
  const [corrRows, setCorrRows] = useState<string[]>([]);
  const [printRows, setPrintRows] = useState<string[]>([]);
  const [opts, setOpts] = useState<Record<string, Options>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReference, setShowReference] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Reset modal-local state on open — modals close without unmounting.
    setError(null);
    setShowReference(false);
    setForm({});
    setCorrRows([]);
    setPrintRows([]);

    const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
    (async () => {
      try {
        const [flaps, comps] = await Promise.all([
          flapTypesApi.getFlapTypes({ limit: 100, ...companyFilter }),
          complementsApi.getComplements({ limit: 100, ...companyFilter }),
        ]);
        setOpts({
          flapType: flaps.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
          complement: comps.data.map((x: any) => ({ uuid: x.uuid, label: x.code })),
        });
      } catch (err) {
        logger.error('Error loading model form options:', err);
      }
      if (model) {
        try {
          // Fetch the full record before editing — list rows are thin.
          const full = await modelsApi.getModel(model.uuid);
          setForm({
            code: full.code ?? '',
            description: full.description ?? '',
            flapTypeUuid: full.flapTypeUuid ?? undefined,
            complementUuid: full.complementUuid ?? undefined,
            imageFileUuid: full.imageFileUuid ?? null,
            sheetLengthFormula: full.sheetLengthFormula ?? '',
            sheetWidthFormula: full.sheetWidthFormula ?? '',
            lowerFlapFormula: full.lowerFlapFormula ?? '',
            upperFlapFormula: full.upperFlapFormula ?? '',
            boxSurfaceFormula: full.boxSurfaceFormula ?? '',
            externalLengthDeltaFormula: full.externalLengthDeltaFormula ?? '',
            externalWidthDeltaFormula: full.externalWidthDeltaFormula ?? '',
            externalHeightDeltaFormula: full.externalHeightDeltaFormula ?? '',
            textsOnImage: full.textsOnImage ?? [],
          });
          setCorrRows(toRows(full.corrugationScoreLineFormulas));
          setPrintRows(toRows(full.printScoreLineFormulas));
        } catch (err) {
          logger.error('Error loading model:', err);
        }
      }
    })();
  }, [isOpen, model, effectiveCompanyId]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: CreateModelForm = {
        code: form.code,
        description: form.description,
        flapTypeUuid: form.flapTypeUuid ?? null,
        complementUuid: form.complementUuid ?? null,
        imageFileUuid: form.imageFileUuid ?? null,
        // Empty grid ⇒ null, not "" (spec §Trazadores).
        corrugationScoreLineFormulas: corrRows.length ? corrRows.join('|') : null,
        printScoreLineFormulas: printRows.length ? printRows.join('|') : null,
      };
      for (const key of SCALAR_FORMULA_FIELDS) {
        payload[key] = form[key] === '' || form[key] == null ? null : form[key];
      }
      if (form.textsOnImage !== undefined) payload.textsOnImage = form.textsOnImage;

      if (isEdit && model) {
        await modelsApi.updateModel(model.uuid, payload);
      } else {
        // superAdmin operating-as: the backend resolves this body companyId;
        // regular users' company always comes from their JWT instead.
        if (effectiveCompanyId) payload.companyId = effectiveCompanyId;
        await modelsApi.createModel(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('models.form.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const select = (key: string, optKey: string) => (
    <select
      name={key}
      data-testid={`model-${key}`}
      className="input-field w-full"
      value={form[key] ?? ''}
      onChange={(e) => set(key, e.target.value || undefined)}
    >
      <option value="">{t('models.form.none')}</option>
      {(opts[optKey] ?? []).map((o) => (
        <option key={o.uuid} value={o.uuid}>{o.label}</option>
      ))}
    </select>
  );

  const section = (labelKey: string, content: React.ReactNode) => (
    <div>
      <h3 className="mb-2 border-b border-secondary-200 pb-1 text-sm font-semibold text-secondary-900">
        {t(`models.sections.${labelKey}`)}
      </h3>
      {content}
    </div>
  );

  const tracesGrid = (
    rows: string[],
    setRows: React.Dispatch<React.SetStateAction<string[]>>,
    gridKey: string,
  ) => (
    <div className="space-y-2" data-testid={`model-${gridKey}`}>
      {rows.length === 0 && (
        <p className="text-sm text-secondary-500">{t('models.form.noTraces')}</p>
      )}
      {rows.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <FormulaField
              name={`${gridKey}-${index}`}
              value={row}
              onChange={(value) =>
                setRows((current) => current.map((r, i) => (i === index ? value : r)))
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={t('models.form.moveUp')}
            data-testid={`model-${gridKey}-up-${index}`}
            disabled={index === 0}
            onClick={() =>
              setRows((current) => {
                const next = [...current];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                return next;
              })
            }
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={t('models.form.moveDown')}
            data-testid={`model-${gridKey}-down-${index}`}
            disabled={index === rows.length - 1}
            onClick={() =>
              setRows((current) => {
                const next = [...current];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                return next;
              })
            }
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            title={t('models.form.removeRow')}
            data-testid={`model-${gridKey}-remove-${index}`}
            onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={`model-${gridKey}-add`}
        onClick={() => setRows((current) => [...current, ''])}
      >
        <Plus className="mr-1 h-4 w-4" />
        {t('models.form.addRow')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('models.editTitle') : t('models.createTitle')}
      size="xl"
    >
      {error && <ErrorMessage message={error} />}

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="model-open-reference"
            onClick={() => setShowReference(true)}
          >
            <BookOpen className="mr-1 h-4 w-4" />
            {t('models.form.referenceButton')}
          </Button>
        </div>

        {section(
          'data',
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                {t('models.fields.code')}
              </label>
              <input
                type="text"
                name="code"
                data-testid="model-code"
                className="input-field w-full"
                value={form.code ?? ''}
                onChange={(e) => set('code', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                {t('models.fields.description')}
              </label>
              <input
                type="text"
                name="description"
                data-testid="model-description"
                className="input-field w-full"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                {t('models.fields.complement')}
              </label>
              {select('complementUuid', 'complement')}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                {t('models.fields.flapType')}
              </label>
              {select('flapTypeUuid', 'flapType')}
            </div>
          </div>,
        )}

        {section(
          'measures',
          <div className="grid grid-cols-1 gap-4">
            {(
              [
                'sheetLengthFormula',
                'sheetWidthFormula',
                'lowerFlapFormula',
                'upperFlapFormula',
                'boxSurfaceFormula',
              ] as const
            ).map((key) => (
              <FormulaField
                key={key}
                name={key}
                label={t(`models.fields.${key}`)}
                value={form[key] ?? ''}
                onChange={(value) => set(key, value)}
              />
            ))}
          </div>,
        )}

        {section(
          'externalDeltas',
          // D-4: these are formula TEXT inputs, not numeric inputs — real
          // data stores both `5` and `2*t`.
          <div className="grid grid-cols-1 gap-4">
            {(
              [
                'externalLengthDeltaFormula',
                'externalWidthDeltaFormula',
                'externalHeightDeltaFormula',
              ] as const
            ).map((key) => (
              <FormulaField
                key={key}
                name={key}
                label={t(`models.fields.${key}`)}
                value={form[key] ?? ''}
                onChange={(value) => set(key, value)}
              />
            ))}
          </div>,
        )}

        {section('corrugationTraces', tracesGrid(corrRows, setCorrRows, 'corrugationScoreLineFormulas'))}
        {section('printTraces', tracesGrid(printRows, setPrintRows, 'printScoreLineFormulas'))}

        {section(
          'image',
          <FileRefUploader
            value={form.imageFileUuid ?? null}
            onChange={(uuid) => set('imageFileUuid', uuid)}
            label={t('models.fields.imageFile')}
          />,
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-secondary-200 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} disabled={saving} data-testid="model-submit">
          {saving ? t('common.saving') : isEdit ? t('common.save') : t('models.addModel')}
        </Button>
      </div>

      <FormulaReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
    </Modal>
  );
};

export default ModelFormModal;
