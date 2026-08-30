import React from 'react';
import { useTranslation } from 'react-i18next';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreatePalletizationForm, PalletType } from '../../types';
import Input from '../ui/Input';
import FileRefUploader from '../ui/FileRefUploader';

interface PalletizationFormFieldsProps {
  register: UseFormRegister<CreatePalletizationForm>;
  errors: FieldErrors<CreatePalletizationForm>;
  watch: UseFormWatch<CreatePalletizationForm>;
  palletTypes: PalletType[];
  technicalFileUuid: string | null;
  imageFileUuid: string | null;
  onTechnicalFileChange: (uuid: string | null) => void;
  onImageFileChange: (uuid: string | null) => void;
}

/** Shared field set for the Create/Edit palletization modals. */
const PalletizationFormFields: React.FC<PalletizationFormFieldsProps> = ({
  register,
  errors,
  watch,
  palletTypes,
  technicalFileUuid,
  imageFileUuid,
  onTechnicalFileChange,
  onImageFileChange,
}) => {
  const { t } = useTranslation();
  const n = (v: any) => (v === '' || v === undefined || v === null ? 0 : Number(v));
  // Parity with Procusto's transient CajasPorPallet.
  const boxesPerPallet =
    n(watch('boxesPerPackage')) *
    (n(watch('packagesPerLevel')) * n(watch('levelsPerPallet')) + n(watch('additionalPackages')));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input {...register('code')} error={errors.code?.message as string} label={t('palletizations.code')} />
        <Input
          {...register('name')}
          label={`${t('palletizations.name')} *`}
          error={errors.name?.message}
        />
      </div>

      <div>
        <label className="gd-label">
          {t('palletizations.description')}
        </label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Input {...register('boxesPerPackage')} error={errors.boxesPerPackage?.message as string} type="number" min={0} step="1" label={t('palletizations.boxesPerPackage')} />
        <Input {...register('packagesPerLevel')} error={errors.packagesPerLevel?.message as string} type="number" min={0} step="1" label={t('palletizations.packagesPerLevel')} />
        <Input {...register('levelsPerPallet')} error={errors.levelsPerPallet?.message as string} type="number" min={0} step="1" label={t('palletizations.levelsPerPallet')} />
        <Input {...register('additionalPackages')} error={errors.additionalPackages?.message as string} type="number" min={0} step="1" label={t('palletizations.additionalPackages')} />
        <Input {...register('sheetsPerPallet')} error={errors.sheetsPerPallet?.message as string} type="number" min={0} step="1" label={t('palletizations.sheetsPerPallet')} />
      </div>

      <div className="rounded-lg bg-secondary-50 border border-secondary-200 px-3 py-2 text-sm text-secondary-700">
        {t('palletizations.boxesPerPallet')}: <span className="font-semibold">{boxesPerPallet}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input {...register('maxPalletHeight')} error={errors.maxPalletHeight?.message as string} type="number" step="any" label={t('palletizations.maxPalletHeight')} placeholder="mm" />
        <Input {...register('surface')} error={errors.surface?.message as string} type="number" step="any" label={t('palletizations.surface')} placeholder="m²" />
        <Input {...register('stackingType')} error={errors.stackingType?.message as string} label={t('palletizations.stackingType')} placeholder="T, L, ..." />
      </div>

      <div>
        <label className="gd-label">
          {t('palletizations.palletType')}
        </label>
        <select
          {...register('palletTypeUuid')}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t('palletizations.selectPalletType')}</option>
          {palletTypes.map((pt) => (
            <option key={pt.uuid} value={pt.uuid}>
              {pt.code}
              {pt.description ? ` — ${pt.description}` : ''}
            </option>
          ))}
        </select>
        {errors.palletTypeUuid && (
          <p className="mt-1 text-sm text-red-600">{errors.palletTypeUuid.message as string}</p>
        )}
      </div>

      <div>
        <label className="gd-label">
          {t('palletizations.observations')}
        </label>
        <textarea
          {...register('observations')}
          rows={2}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.observations && (
          <p className="mt-1 text-sm text-red-600">{errors.observations.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileRefUploader
          value={technicalFileUuid}
          onChange={onTechnicalFileChange}
          label={t('palletizations.technicalFile')}
        />
        <FileRefUploader
          value={imageFileUuid}
          onChange={onImageFileChange}
          label={t('palletizations.imageFile')}
          accept="image/*"
        />
      </div>
    </>
  );
};

export default PalletizationFormFields;
