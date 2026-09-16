import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import Input from '../ui/Input';
import { CreateProductForm } from '../../types';
import { ProductFormOptions } from './ProductFormModal';

interface Props {
  register: UseFormRegister<CreateProductForm>;
  errors: FieldErrors<CreateProductForm>;
  options: ProductFormOptions;
}

const PRINT_FLAGS = [
  'printCode',
  'printDate',
  'printRecyclable',
  'printWarranty',
  'printLogo',
  'printNationalIndustry',
  'printExport',
] as const;

const ROTATION_FLAGS = ['allowsRotation', 'allowsPartialRotation', 'mandatoryRotation'] as const;

const ProductPalletizingTab: React.FC<Props> = ({ register, errors, options }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="gd-label">{t('products.fields.palletization')}</label>
          <select className="input-field w-full" {...register('palletizationUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.palletizations.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gd-label">{t('products.fields.strappingType')}</label>
          <select className="input-field w-full" {...register('strappingTypeUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.strappingTypes.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gd-label">{t('products.fields.traceType')}</label>
          <select className="input-field w-full" {...register('traceTypeUuid')}>
            <option value="">{t('products.form.none')}</option>
            {options.traceTypes.map((o) => (
              <option key={o.uuid} value={o.uuid}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input type="number" label={t('products.fields.labelsPerPallet')} {...register('labelsPerPallet')} error={errors.labelsPerPallet?.message} />
        <Input type="text" label={t('products.fields.labelText')} {...register('labelText')} />
        <Input type="number" step="any" label={t('products.fields.preferredWidth')} {...register('preferredWidth')} error={errors.preferredWidth?.message} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRINT_FLAGS.map((flag) => (
          <label key={flag} className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" {...register(flag)} />
            {t(`products.fields.${flag}`)}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Input type="number" step="any" label={t('products.fields.compressionTest')} {...register('compressionTest')} error={errors.compressionTest?.message} />
        <Input type="number" step="any" label={t('products.fields.burstTest')} {...register('burstTest')} error={errors.burstTest?.message} />
        <Input type="number" step="any" label={t('products.fields.cobbTest')} {...register('cobbTest')} error={errors.cobbTest?.message} />
        <Input type="number" step="any" label={t('products.fields.ect')} {...register('ect')} error={errors.ect?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Input type="number" step="any" label={t('products.fields.lengthUpperTolerance')} {...register('lengthUpperTolerance')} error={errors.lengthUpperTolerance?.message} />
        <Input type="number" step="any" label={t('products.fields.lengthLowerTolerance')} {...register('lengthLowerTolerance')} error={errors.lengthLowerTolerance?.message} />
        <Input type="number" step="any" label={t('products.fields.widthUpperTolerance')} {...register('widthUpperTolerance')} error={errors.widthUpperTolerance?.message} />
        <Input type="number" step="any" label={t('products.fields.widthLowerTolerance')} {...register('widthLowerTolerance')} error={errors.widthLowerTolerance?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input type="number" step="any" label={t('products.fields.overrunPercentage')} {...register('overrunPercentage')} error={errors.overrunPercentage?.message} />
        <Input type="number" step="any" label={t('products.fields.underrunPercentage')} {...register('underrunPercentage')} error={errors.underrunPercentage?.message} />
        <Input type="number" step="any" label={t('products.fields.corrugationOverproduction')} {...register('corrugationOverproduction')} error={errors.corrugationOverproduction?.message} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROTATION_FLAGS.map((flag) => (
          <label key={flag} className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" {...register(flag)} />
            {t(`products.fields.${flag}`)}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-secondary-700">
          <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" {...register('allowsGluing')} />
          {t('products.fields.allowsGluing')}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input type="text" label={t('products.fields.claspClosure')} {...register('claspClosure')} />
        <Input type="number" step="any" label={t('products.fields.averageWeight')} {...register('averageWeight')} error={errors.averageWeight?.message} />
        <Input type="number" step="any" label={t('products.fields.associatedQuantity')} {...register('associatedQuantity')} error={errors.associatedQuantity?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input type="text" label={t('products.fields.foodSafetyNumber')} {...register('foodSafetyNumber')} />
        <Input type="text" label={t('products.fields.blueprintRef')} {...register('blueprintRef')} />
      </div>

      <div>
        <label className="gd-label">{t('products.fields.notes')}</label>
        <textarea className="input-field w-full" rows={3} {...register('notes')} />
      </div>
      <div>
        <label className="gd-label">{t('products.fields.quotingNotes')}</label>
        <textarea className="input-field w-full" rows={2} {...register('quotingNotes')} />
      </div>
    </div>
  );
};

export default ProductPalletizingTab;
