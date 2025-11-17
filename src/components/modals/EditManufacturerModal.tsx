import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Manufacturer, CreateManufacturerForm } from '../../types';
import { manufacturersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface EditManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  manufacturer: Manufacturer | null;
}

const EditManufacturerModal: React.FC<EditManufacturerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  manufacturer,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateManufacturerForm>();

  useEffect(() => {
    if (isOpen && manufacturer) {
      reset({
        code: manufacturer.code,
        name: manufacturer.name,
      });
    }
  }, [isOpen, manufacturer, reset]);

  const onSubmit = async (data: CreateManufacturerForm) => {
    if (!manufacturer) return;

    setLoading(true);
    setError('');

    try {
      await manufacturersApi.updateManufacturer(manufacturer.uuid, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating manufacturer:', err);
      setError(
        err.response?.data?.message ||
        t('manufacturers.updateFailed')
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

  if (!manufacturer) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('manufacturers.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('manufacturers.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('manufacturers.validation.codeRequired'),
            })}
            placeholder={t('manufacturers.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('manufacturers.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('manufacturers.validation.nameRequired'),
            })}
            placeholder={t('manufacturers.namePlaceholder')}
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
            {loading ? t('common.loading') : t('manufacturers.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditManufacturerModal;
