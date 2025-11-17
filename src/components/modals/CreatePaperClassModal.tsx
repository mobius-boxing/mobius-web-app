import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreatePaperClassForm, PaperSupply } from '../../types';
import { paperClassesApi, paperSuppliesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DualListSelector from '../ui/DualListSelector';

interface CreatePaperClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperClassModal: React.FC<CreatePaperClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [availableSupplies, setAvailableSupplies] = useState<PaperSupply[]>([]);
  const [assignedSupplies, setAssignedSupplies] = useState<PaperSupply[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePaperClassForm>();

  // Fetch paper supplies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPaperSupplies();
    } else {
      // Reset state when modal closes
      setAvailableSupplies([]);
      setAssignedSupplies([]);
    }
  }, [isOpen]);

  const fetchPaperSupplies = async () => {
    setLoadingSupplies(true);
    try {
      const response = await paperSuppliesApi.getPaperSupplies({ limit: 100 });
      setAvailableSupplies(response.data);
      setAssignedSupplies([]);
    } catch (err: any) {
      console.error('Error fetching paper supplies:', err);
      setError('Failed to load paper supplies');
    } finally {
      setLoadingSupplies(false);
    }
  };

  const onSubmit = async (data: CreatePaperClassForm) => {
    setLoading(true);
    setError('');

    try {
      // Extract IDs from assigned supplies
      const papers = assignedSupplies.map(supply => parseInt(supply.id));

      const formData = {
        code: data.code,
        name: data.name,
        papers,
      };

      await paperClassesApi.createPaperClass(formData);
      reset();
      setAssignedSupplies([]);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating paper class:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create paper class. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (items: PaperSupply[]) => {
    setAssignedSupplies([...assignedSupplies, ...items]);
    setAvailableSupplies(
      availableSupplies.filter(s => !items.some(item => item.id === s.id))
    );
  };

  const handleUnassign = (items: PaperSupply[]) => {
    setAvailableSupplies([...availableSupplies, ...items]);
    setAssignedSupplies(
      assignedSupplies.filter(s => !items.some(item => item.id === s.id))
    );
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperClasses.createTitle')} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('code', {
            required: 'Code is required',
            minLength: {
              value: 1,
              message: 'Code must be at least 1 character',
            },
            maxLength: {
              value: 50,
              message: 'Code must be less than 50 characters',
            },
          })}
          label={t('paperClasses.code')}
          placeholder={t('paperClasses.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name', {
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
            maxLength: {
              value: 100,
              message: 'Name must be less than 100 characters',
            },
          })}
          label={t('paperClasses.name')}
          placeholder={t('paperClasses.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <DualListSelector<PaperSupply>
          availableItems={availableSupplies}
          assignedItems={assignedSupplies}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          getItemId={(supply) => supply.id}
          getItemLabel={(supply) => supply.name}
          getItemDescription={(supply) => supply.code}
          availableLabel={t('paperClasses.availableSupplies')}
          assignedLabel={t('paperClasses.assignedSupplies')}
          searchPlaceholder={t('paperClasses.searchSupplies')}
          loading={loadingSupplies}
          disabled={loading}
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
            {t('paperClasses.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePaperClassModal;
