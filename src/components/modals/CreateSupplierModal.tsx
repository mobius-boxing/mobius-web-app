import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateSupplierForm } from '../../types';
import { suppliersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSupplierForm>({
    defaultValues: {
      suppliesSheets: false,
      suppliesElaborated: false,
      suppliesConsumables: false,
      suppliesPaper: false,
      suppliesTooling: false,
    },
  });

  const onSubmit = async (data: CreateSupplierForm) => {
    setLoading(true);
    setError('');

    try {
      await suppliersApi.createSupplier(data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating supplier:', err);
      setError(
        err.response?.data?.message ||
        t('suppliers.createFailed')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('suppliers.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('suppliers.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('suppliers.validation.codeRequired'),
            })}
            placeholder={t('suppliers.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-secondary-700">
            {t('suppliers.supplyTypes')}
          </label>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesSheets')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.sheets')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesElaborated')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.elaborated')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesConsumables')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.consumables')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesPaper')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.paper')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesTooling')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.tooling')}</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('suppliers.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSupplierModal;
