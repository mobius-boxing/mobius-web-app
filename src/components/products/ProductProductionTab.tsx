import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import Input from '../ui/Input';
import { CreateProductForm } from '../../types';
import { ProductFormOptions } from './ProductFormModal';

type OuterDimField = 'externalLength' | 'externalWidth' | 'externalHeight';
type TriggerField = OuterDimField | 'boxSurface' | 'grammage' | 'flap';

interface Props {
  register: UseFormRegister<CreateProductForm>;
  errors: FieldErrors<CreateProductForm>;
  watch: UseFormWatch<CreateProductForm>;
  options: ProductFormOptions;
  onOuterDimBlur: (field: TriggerField, value: number | null) => void;
  onModelChange: () => void;
  calcError: string | null;
  calculating: boolean;
  effectiveGrammage: number | null;
  boxWeight: number | null;
}

const measureFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
/** Display only — stored values keep full double precision (L-010). */
const formatMeasure = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? measureFormat.format(n) : '—';
};

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-md bg-secondary-50 p-3 text-center">
    <p className="text-xs font-medium uppercase text-secondary-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-secondary-900">{value}</p>
  </div>
);

const num = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
};

const ProductProductionTab: React.FC<Props> = ({
  register,
  errors,
  watch,
  options,
  onOuterDimBlur,
  onModelChange,
  calcError,
  calculating,
  effectiveGrammage,
  boxWeight,
}) => {
  const { t } = useTranslation();

  const triggerBlur = (field: TriggerField) => () => onOuterDimBlur(field, num(watch(field)));
  // The 6 calculate-response fields (+ surface) a model's formulas can fill —
  // labelled "(calculado)" once a model is selected (mockup "Desarrollo de
  // Plancha (Calculado)"), but they stay editable inputs (D-2).
  const hasModel = !!watch('modelUuid');
  const calcLabel = (key: 'sheetLength' | 'sheetWidth' | 'lowerFlap' | 'upperFlap' | 'boxSurface' | 'corrugationScoreLines' | 'printScoreLines') =>
    hasModel ? `${t(`products.fields.${key}`)}${t('products.fields.calculatedSuffix')}` : t(`products.fields.${key}`);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-secondary-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-secondary-900">{t('products.fields.geometrySection')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="gd-label">{t('products.fields.corrugation')} *</label>
            <select className="input-field w-full" {...register('corrugationUuid')}>
              <option value="">{t('products.fields.selectCorrugation')}</option>
              {options.corrugations.map((o) => (
                <option key={o.uuid} value={o.uuid}>{o.label}</option>
              ))}
            </select>
            {errors.corrugationUuid && (
              <p className="mt-1.5 text-sm text-red-600">{errors.corrugationUuid.message}</p>
            )}
          </div>
          <div>
            <label className="gd-label">{t('products.fields.model')}</label>
            <select
              className="input-field w-full"
              {...register('modelUuid', { onChange: () => onModelChange() })}
            >
              <option value="">{t('products.fields.selectModel')}</option>
              {options.models.map((o) => (
                <option key={o.uuid} value={o.uuid}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-primary-200 bg-primary-50/40 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-primary-700">
            {t('products.fields.outerDimsTitle')}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['externalLength', 'externalWidth', 'externalHeight'] as const).map((field) => (
              <Input
                key={field}
                type="number"
                step="any"
                label={t(`products.fields.${field}`)}
                {...register(field, { onBlur: triggerBlur(field) })}
                error={errors[field]?.message}
              />
            ))}
          </div>
        </div>

        {calcError && <p className="mt-2 text-sm text-red-600">{calcError}</p>}
        {calculating && <p className="mt-2 text-sm text-secondary-500">{t('products.calculate.loading')}</p>}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-secondary-500">
              {t('products.fields.innerDimsTitle')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label={t('products.fields.boxLength')} value={formatMeasure(watch('boxLength'))} />
              <StatCard label={t('products.fields.boxWidth')} value={formatMeasure(watch('boxWidth'))} />
              <StatCard label={t('products.fields.boxHeight')} value={formatMeasure(watch('boxHeight'))} />
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-secondary-500">
              {t('products.fields.sheetDevelopmentTitle')}
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input
                type="number"
                step="any"
                label={calcLabel('sheetLength')}
                {...register('sheetLength')}
                error={errors.sheetLength?.message}
              />
              <Input
                type="number"
                step="any"
                label={calcLabel('sheetWidth')}
                {...register('sheetWidth')}
                error={errors.sheetWidth?.message}
              />
              <Input
                type="number"
                step="any"
                label={t('products.fields.additionalSheetLength')}
                {...register('additionalSheetLength')}
                error={errors.additionalSheetLength?.message}
              />
              <Input
                type="number"
                step="any"
                label={t('products.fields.flap')}
                {...register('flap', { onBlur: triggerBlur('flap') })}
                error={errors.flap?.message}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase text-secondary-500">{t('products.fields.flapsTitle')}</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Input type="number" step="any" label={calcLabel('lowerFlap')} {...register('lowerFlap')} error={errors.lowerFlap?.message} />
            <Input type="number" step="any" label={calcLabel('upperFlap')} {...register('upperFlap')} error={errors.upperFlap?.message} />
            <Input type="number" step="any" label={t('products.fields.flapOverlap')} {...register('flapOverlap')} error={errors.flapOverlap?.message} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          type="number"
          step="any"
          label={t('products.fields.grammage')}
          {...register('grammage', { onBlur: triggerBlur('grammage') })}
          error={errors.grammage?.message}
        />
        <Input
          type="number"
          step="any"
          label={calcLabel('boxSurface')}
          {...register('boxSurface', { onBlur: triggerBlur('boxSurface') })}
          error={errors.boxSurface?.message}
        />
        <StatCard label={t('products.fields.boxWeight')} value={formatMeasure(boxWeight)} />
      </div>
      {effectiveGrammage != null && (
        <p className="text-xs text-secondary-500">
          {t('products.fields.effectiveGrammage', { value: effectiveGrammage })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input type="text" label={calcLabel('corrugationScoreLines')} {...register('corrugationScoreLines')} />
        <Input type="text" label={calcLabel('printScoreLines')} {...register('printScoreLines')} />
      </div>
      <label className="flex items-center gap-2 text-sm text-secondary-700">
        <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" {...register('symmetricScoreLines')} />
        {t('products.fields.symmetricScoreLines')}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input type="number" label={t('products.fields.colorCount')} {...register('colorCount')} error={errors.colorCount?.message} />
        <Input type="number" step="any" label={t('products.fields.printSides')} {...register('printSides')} error={errors.printSides?.message} />
        <Input type="text" label={t('products.fields.inks')} {...register('inks')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="gd-label">{t('products.fields.flapType')}</label>
          <select className="input-field w-full" {...register('flapTypeUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.flapTypes.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gd-label">{t('products.fields.glueType')}</label>
          <select className="input-field w-full" {...register('glueTypeUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.glueTypes.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gd-label">{t('products.fields.complement')}</label>
          <select className="input-field w-full" {...register('complementUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.complements.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductProductionTab;
