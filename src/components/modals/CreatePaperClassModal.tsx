import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePaperClassForm, PaperSupply } from '../../types';
import { paperClassesApi, paperSuppliesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import DualListSelector from '../ui/DualListSelector';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

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
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [availableSupplies, setAvailableSupplies] = useState<PaperSupply[]>([]);
  const [assignedSupplies, setAssignedSupplies] = useState<PaperSupply[]>([]);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    setError,
    handleSubmit,
    handleClose: baseHandleClose,
  } = useModalForm<CreatePaperClassForm>({
    onSuccess: () => {
      setAssignedSupplies([]);
      onSuccess();
    },
    onClose,
  });

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
      logger.error('Error fetching paper supplies:', err);
      setError('Failed to load paper supplies');
    } finally {
      setLoadingSupplies(false);
    }
  };

  const onSubmit = handleSubmit((data) => {
    // Extract UUIDs from assigned supplies
    const papers = assignedSupplies.map(supply => supply.uuid);

    const formData = {
      code: data.code,
      name: data.name,
      papers,
    };

    return paperClassesApi.createPaperClass(formData);
  });

  const handleAssign = (items: PaperSupply[]) => {
    setAssignedSupplies([...assignedSupplies, ...items]);
    setAvailableSupplies(
      availableSupplies.filter(s => !items.some(item => item.uuid === s.uuid))
    );
  };

  const handleUnassign = (items: PaperSupply[]) => {
    setAvailableSupplies([...availableSupplies, ...items]);
    setAssignedSupplies(
      assignedSupplies.filter(s => !items.some(item => item.uuid === s.uuid))
    );
  };

  const handleClose = () => {
    setAssignedSupplies([]);
    setAvailableSupplies([]);
    baseHandleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperClasses.createTitle')} size="xl">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

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
          getItemId={(supply) => supply.uuid}
          getItemLabel={(supply) => supply.name}
          getItemDescription={(supply) => supply.code}
          availableLabel={t('paperClasses.availableSupplies')}
          assignedLabel={t('paperClasses.assignedSupplies')}
          searchPlaceholder={t('paperClasses.searchSupplies')}
          loading={loadingSupplies}
          disabled={loading}
        />

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('paperClasses.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreatePaperClassModal;
