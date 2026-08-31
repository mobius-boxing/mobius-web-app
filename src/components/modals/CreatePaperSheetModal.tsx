import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePaperSheetForm, Manufacturer, Supplier, Corrugation } from '../../types';
import { paperSheetsApi, manufacturersApi, suppliersApi, corrugationsApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { createPaperSheetSchema } from '../../validation/schemas/paperSheet';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface CreatePaperSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperSheetModal: React.FC<CreatePaperSheetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [corrugations, setCorrugations] = useState<Corrugation[]>([]);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreatePaperSheetForm>({
    onSuccess,
    onClose,
    schema: createPaperSheetSchema(t),
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, effectiveCompanyId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, corrugationsRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        corrugationsApi.getCorrugations({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCorrugations(corrugationsRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const paperSheetData = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      supplierId: data.supplierId || undefined,
      manufacturerId: data.manufacturerId || undefined,
      corrugationId: data.corrugationId || undefined,
      minimumStock: data.minimumStock || undefined,
      length: data.length || undefined,
      width: data.width || undefined,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };

    return paperSheetsApi.createPaperSheet(paperSheetData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperSheets.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('paperSheets.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('paperSheets.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.name')} *
          </label>
          <Input
            {...register('name')}
            placeholder={t('paperSheets.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.description')}
          </label>
          <Input
            {...register('description')}
            error={errors.description?.message as string}
            placeholder={t('paperSheets.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.supplier')}
          </label>
          <select
            {...register('supplierId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSheets.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
          {errors.supplierId && (
            <p className="mt-1 text-sm text-red-600">{errors.supplierId.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.manufacturer')}
          </label>
          <select
            {...register('manufacturerId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSheets.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
          {errors.manufacturerId && (
            <p className="mt-1 text-sm text-red-600">{errors.manufacturerId.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.corrugation')}
          </label>
          <select
            {...register('corrugationId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSheets.selectCorrugation')}</option>
            {corrugations.map((corrugation) => (
              <option key={corrugation.uuid} value={corrugation.uuid}>
                {corrugation.code}
              </option>
            ))}
          </select>
          {errors.corrugationId && (
            <p className="mt-1 text-sm text-red-600">{errors.corrugationId.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('paperSheets.length')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('length')}
              error={errors.length?.message as string}
              placeholder={t('paperSheets.lengthPlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('paperSheets.width')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('width')}
              error={errors.width?.message as string}
              placeholder={t('paperSheets.widthPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="gd-label">
            {t('paperSheets.minimumStock')}
          </label>
          <Input
            type="number"
            {...register('minimumStock')}
            error={errors.minimumStock?.message as string}
            placeholder={t('paperSheets.minimumStockPlaceholder')}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('paperSheets.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreatePaperSheetModal;
