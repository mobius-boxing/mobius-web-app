import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateToolingForm, ToolingType, Manufacturer, Supplier } from '../../types';
import { toolingsApi, toolingTypesApi, manufacturersApi, suppliersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateToolingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateToolingModal: React.FC<CreateToolingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toolingTypes, setToolingTypes] = useState<ToolingType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateToolingForm>();

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [toolingTypesRes, manufacturersRes, suppliersRes] = await Promise.all([
        toolingTypesApi.getToolingTypes({ limit: 1000 }),
        manufacturersApi.getManufacturers({ limit: 1000 }),
        suppliersApi.getSuppliers({ limit: 1000 }),
      ]);
      setToolingTypes(toolingTypesRes.data || []);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const onSubmit = async (data: CreateToolingForm) => {
    setLoading(true);
    setError('');

    try {
      await toolingsApi.createTooling(data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating tooling:', err);
      setError(
        err.response?.data?.message ||
        t('toolings.createFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolings.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name', {
            required: t('toolings.validation.nameRequired'),
            minLength: {
              value: 1,
              message: t('toolings.validation.nameMinLength'),
            },
            maxLength: {
              value: 255,
              message: t('toolings.validation.nameMaxLength'),
            },
          })}
          label={t('toolings.name')}
          placeholder={t('toolings.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('toolings.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.toolingType')} *
          </label>
          <select
            {...register('toolingTypeUuid', {
              required: t('toolings.validation.toolingTypeRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectToolingType')}</option>
            {toolingTypes.map((tt) => (
              <option key={tt.uuid} value={tt.uuid}>
                {tt.code} - {tt.name}
              </option>
            ))}
          </select>
          {errors.toolingTypeUuid && (
            <p className="text-sm text-red-600 mt-1">{errors.toolingTypeUuid.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.manufacturer')}
          </label>
          <select
            {...register('manufacturerUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectManufacturer')}</option>
            {manufacturers.map((m) => (
              <option key={m.uuid} value={m.uuid}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.supplier')}
          </label>
          <select
            {...register('supplierUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectSupplier')}</option>
            {suppliers.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.code}
              </option>
            ))}
          </select>
        </div>

        <Input
          {...register('minimumStock', {
            valueAsNumber: true,
            min: {
              value: 0,
              message: t('toolings.validation.minimumStockMin'),
            },
          })}
          type="number"
          label={t('toolings.minimumStock')}
          placeholder="0"
          error={errors.minimumStock?.message as string}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('toolings.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateToolingModal;
