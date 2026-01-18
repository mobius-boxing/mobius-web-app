import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateWarehouseForm } from '../../types';
import { warehousesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWarehouseForm>({
    defaultValues: {
      gridRows: 10,
      gridCols: 10,
    },
  });

  const onSubmit = async (data: CreateWarehouseForm) => {
    setLoading(true);
    setError('');

    try {
      await warehousesApi.createWarehouse({
        ...data,
        companyId: effectiveCompanyId,
      });
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating warehouse:', err);
      setError(
        err.response?.data?.message ||
        t('warehouses.createFailed')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('warehouses.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('warehouses.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('warehouses.validation.nameRequired'),
            })}
            placeholder={t('warehouses.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('warehouses.gridRows')} *
              </label>
              <Input
                type="number"
                {...register('gridRows', {
                  required: t('warehouses.validation.gridRowsRequired'),
                  min: { value: 1, message: t('warehouses.validation.gridRowsMin') },
                  max: { value: 50, message: t('warehouses.validation.gridRowsMax') },
                  valueAsNumber: true,
                })}
                placeholder="10"
                defaultValue={10}
                error={errors.gridRows?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('warehouses.gridCols')} *
              </label>
              <Input
                type="number"
                {...register('gridCols', {
                  required: t('warehouses.validation.gridColsRequired'),
                  min: { value: 1, message: t('warehouses.validation.gridColsMin') },
                  max: { value: 50, message: t('warehouses.validation.gridColsMax') },
                  valueAsNumber: true,
                })}
                placeholder="10"
                defaultValue={10}
                error={errors.gridCols?.message}
              />
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            💡 {t('warehouses.gridSizeInfo')}
          </p>
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
            {loading ? t('common.loading') : t('warehouses.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWarehouseModal;
