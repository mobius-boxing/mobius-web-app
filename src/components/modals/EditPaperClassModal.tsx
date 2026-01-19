import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { PaperClass, CreatePaperClassForm, PaperSupply } from '../../types';
import { paperClassesApi, paperSuppliesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import DualListSelector from '../ui/DualListSelector';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditPaperClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperClass: PaperClass | null;
  onSuccess: () => void;
}

const EditPaperClassModal: React.FC<EditPaperClassModalProps> = ({
  isOpen,
  onClose,
  paperClass,
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
      reset,
    },
    loading,
    error,
    setError,
    handleSubmit,
    handleClose: baseHandleClose,
  } = useModalForm<CreatePaperClassForm>({
    onSuccess,
    onClose,
  });

  // Fetch paper supplies and initialize assigned/available lists
  useEffect(() => {
    if (isOpen && paperClass) {
      reset({
        code: paperClass.code,
        name: paperClass.name,
      });
      fetchPaperSupplies();
    } else {
      // Reset state when modal closes
      setAvailableSupplies([]);
      setAssignedSupplies([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paperClass, reset]);

  const fetchPaperSupplies = async () => {
    if (!paperClass) return;

    setLoadingSupplies(true);
    try {
      const response = await paperSuppliesApi.getPaperSupplies({ limit: 100 });
      const allSupplies = response.data;

      // Parse existing papers (array of IDs)
      const existingPaperIds = Array.isArray(paperClass.papers) ? paperClass.papers : [];

      // Split supplies into assigned and available
      const assigned = allSupplies.filter(supply =>
        existingPaperIds.includes(parseInt(supply.id))
      );
      const available = allSupplies.filter(supply =>
        !existingPaperIds.includes(parseInt(supply.id))
      );

      setAssignedSupplies(assigned);
      setAvailableSupplies(available);
    } catch (err: unknown) {
      console.error('Error fetching paper supplies:', err);
      setError('Failed to load paper supplies');
    } finally {
      setLoadingSupplies(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!paperClass) return;

    // Extract IDs from assigned supplies
    const papers = assignedSupplies.map(supply => parseInt(supply.id));

    const formData = {
      code: data.code,
      name: data.name,
      papers,
    };

    await paperClassesApi.updatePaperClass(paperClass.id, formData);
    setAssignedSupplies([]);
  });

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
    setAssignedSupplies([]);
    setAvailableSupplies([]);
    baseHandleClose();
  };

  if (!paperClass) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperClasses.editTitle')} size="xl">
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
          getItemId={(supply) => supply.id}
          getItemLabel={(supply) => supply.name}
          getItemDescription={(supply) => supply.code}
          availableLabel={t('paperClasses.availableSupplies')}
          assignedLabel={t('paperClasses.assignedSupplies')}
          searchPlaceholder={t('paperClasses.searchSupplies')}
          loading={loadingSupplies}
          disabled={loading}
        />

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('paperClasses.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditPaperClassModal;
