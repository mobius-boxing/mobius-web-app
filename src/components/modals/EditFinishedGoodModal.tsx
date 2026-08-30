import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateFinishedGoodForm, FinishedGood, Manufacturer, Supplier } from '../../types';
import { finishedGoodsApi, manufacturersApi, suppliersApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { editFinishedGoodSchema } from '../../validation/schemas/finishedGood';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

interface EditFinishedGoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGood: FinishedGood | null;
  onSuccess: () => void;
}

const EditFinishedGoodModal: React.FC<EditFinishedGoodModalProps> = ({
  isOpen,
  onClose,
  finishedGood,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      reset,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateFinishedGoodForm>({
    onSuccess,
    onClose,
    schema: editFinishedGoodSchema(t),
  });

  useEffect(() => {
    if (isOpen && finishedGood) {
      setDropdownsLoaded(false);
      fetchDropdowns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, finishedGood, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && finishedGood && dropdownsLoaded) {
      reset({
        code: finishedGood.code || '',
        name: finishedGood.name,
        description: finishedGood.description || '',
        supplierUuid: finishedGood.supplier?.uuid || '',
        manufacturerUuid: finishedGood.manufacturer?.uuid || '',
        minimumStock: finishedGood.minimumStock ?? undefined,
      });
    }
  }, [isOpen, finishedGood, dropdownsLoaded, reset]);

  const fetchDropdowns = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [suppliersRes, manufacturersRes] = await Promise.all([
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
      ]);
      setSuppliers(suppliersRes.data || []);
      setManufacturers(manufacturersRes.data || []);
    } catch (err) {
      logger.error('Error fetching finished-good dropdowns:', err);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  if (!finishedGood) return null;

  const onSubmit = handleSubmit(async (data) => {
    await finishedGoodsApi.updateFinishedGood(finishedGood.uuid, {
      ...data,
      supplierUuid: data.supplierUuid || undefined,
      manufacturerUuid: data.manufacturerUuid || undefined,
    });
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('finishedGoods.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('code')}
            label={t('finishedGoods.code')}
            placeholder={t('finishedGoods.codePlaceholder')}
            error={errors.code?.message}
          />

          <Input
            {...register('name')}
            label={`${t('finishedGoods.name')} *`}
            placeholder={t('finishedGoods.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('finishedGoods.description')}
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder={t('finishedGoods.descriptionPlaceholder')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="gd-label">
              {t('finishedGoods.supplier')}
            </label>
            <select
              {...register('supplierUuid')}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('finishedGoods.selectSupplier')}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.uuid} value={supplier.uuid}>
                  {supplier.code}
                </option>
              ))}
            </select>
            {errors.supplierUuid && (
              <p className="mt-1 text-sm text-red-600">{errors.supplierUuid.message as string}</p>
            )}
          </div>

          <div>
            <label className="gd-label">
              {t('finishedGoods.manufacturer')}
            </label>
            <select
              {...register('manufacturerUuid')}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('finishedGoods.selectManufacturer')}</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer.uuid} value={manufacturer.uuid}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
            {errors.manufacturerUuid && (
              <p className="mt-1 text-sm text-red-600">{errors.manufacturerUuid.message as string}</p>
            )}
          </div>

          <Input
            {...register('minimumStock')}
            error={errors.minimumStock?.message as string}
            type="number"
            step="1"
            label={t('finishedGoods.minimumStock')}
            placeholder="0"
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('finishedGoods.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditFinishedGoodModal;
