import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateWarehouseForm } from '../../types';
import { warehousesApi } from '../../services/api';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWarehouseForm>();

  const onSubmit = async (data: CreateWarehouseForm) => {
    setLoading(true);
    setError('');

    try {
      await warehousesApi.createWarehouse(data);
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
