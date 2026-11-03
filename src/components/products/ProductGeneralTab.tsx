import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import Input from '../ui/Input';
import FileRefUploader from '../ui/FileRefUploader';
import { EntityAutocomplete, FilterOption } from '../ui/filters';
import ProductApprovalWidget from '../forms/ProductApprovalWidget';
import { CreateProductForm, Product } from '../../types';

export interface FileUuids {
  technicalSheetFileUuid: string | null;
  blueprintFileUuid: string | null;
  sketchFileUuid: string | null;
  imageFileUuid: string | null;
}

interface Props {
  register: UseFormRegister<CreateProductForm>;
  errors: FieldErrors<CreateProductForm>;
  customer: FilterOption | undefined;
  loadCustomerOptions: (search: string) => Promise<FilterOption[]>;
  onCustomerChange: (next: FilterOption | undefined) => void;
  fileUuids: FileUuids;
  onFileUuidsChange: (next: FileUuids) => void;
  isEdit: boolean;
  current: Product | null;
  onApprovalChanged: (updated: Product) => void;
}

const ProductGeneralTab: React.FC<Props> = ({
  register,
  errors,
  customer,
  loadCustomerOptions,
  onCustomerChange,
  fileUuids,
  onFileUuidsChange,
  isEdit,
  current,
  onApprovalChanged,
}) => {
  const { t } = useTranslation();

  const setFile = (key: keyof FileUuids) => (uuid: string | null) =>
    onFileUuidsChange({ ...fileUuids, [key]: uuid });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t('products.code')}
          required
          {...register('code')}
          placeholder={t('products.codePlaceholder')}
          error={errors.code?.message}
        />
        <Input
          label={t('products.clientCode')}
          {...register('clientCode')}
          placeholder={t('products.clientCodePlaceholder')}
          error={errors.clientCode?.message}
        />
        <div>
          <label className="gd-label" htmlFor="product-customer">
            {t('products.customer')} *
          </label>
          <input type="hidden" {...register('customerId')} />
          <EntityAutocomplete
            id="product-customer"
            data-testid="product-customer"
            value={customer}
            onChange={onCustomerChange}
            loadOptions={loadCustomerOptions}
            placeholder={t('products.selectCustomer')}
          />
          {errors.customerId && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customerId.message}</p>
          )}
        </div>
        <Input
          type="number"
          label={t('products.revision')}
          {...register('revision')}
          placeholder={t('products.revisionPlaceholder')}
          error={errors.revision?.message}
        />
      </div>

      <div>
        <label className="gd-label">{t('products.description')}</label>
        <textarea
          className="input-field w-full"
          rows={3}
          {...register('description')}
          placeholder={t('products.descriptionPlaceholder')}
        />
        {errors.description && (
          <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-secondary-700">
        <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" {...register('vip')} />
        {t('products.vip')}
      </label>

      {isEdit && current ? (
        <ProductApprovalWidget product={current} onChanged={onApprovalChanged} />
      ) : (
        <p className="text-sm text-secondary-500">{t('products.form.approvalAfterSave')}</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-secondary-900">{t('products.files.title')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FileRefUploader
            value={fileUuids.technicalSheetFileUuid}
            onChange={setFile('technicalSheetFileUuid')}
            label={t('products.files.technicalSheet')}
          />
          <FileRefUploader
            value={fileUuids.blueprintFileUuid}
            onChange={setFile('blueprintFileUuid')}
            label={t('products.files.blueprint')}
          />
          <FileRefUploader
            value={fileUuids.sketchFileUuid}
            onChange={setFile('sketchFileUuid')}
            label={t('products.files.sketch')}
          />
          <FileRefUploader
            value={fileUuids.imageFileUuid}
            onChange={setFile('imageFileUuid')}
            label={t('products.files.image')}
            accept="image/*"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductGeneralTab;
