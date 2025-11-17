import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateManufacturerForm } from '../../types';
import { manufacturersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateManufacturerModal: React.FC<CreateManufacturerModalProps> = ({
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
  } = useForm<CreateManufacturerForm>();

  const onSubmit = async (data: CreateManufacturerForm) => {
    setLoading(true);
    setError('');

    try {
      await manufacturersApi.createManufacturer(data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating manufacturer:', err);
      setError(
        err.response?.data?.message ||
        t('manufacturers.createFailed')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('manufacturers.createTitle')}>
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
            {loading ? t('common.loading') : t('manufacturers.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateManufacturerModal;
