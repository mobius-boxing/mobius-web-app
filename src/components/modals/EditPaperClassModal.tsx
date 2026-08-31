import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { editPaperClassSchema } from '../../validation/schemas/paperClass';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { PaperClass, CreatePaperClassForm, PaperSupply } from '../../types';
import { paperClassesApi, paperSuppliesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import DualListSelector from '../ui/DualListSelector';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

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
  const { effectiveCompanyId } = useEffectiveCompany();
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
    schema: editPaperClassSchema(t),
  });

  useEffect(() => {
    if (isOpen && paperClass) {
      reset({
        code: paperClass.code,
        name: paperClass.name,
      });
      fetchPaperSupplies();
    } else {
      setAvailableSupplies([]);
      setAssignedSupplies([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paperClass, reset]);

  const fetchPaperSupplies = async () => {
    if (!paperClass) return;

    setLoadingSupplies(true);
    try {
      const response = await paperSuppliesApi.getPaperSupplies({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) });
      const allSupplies = response.data;

      const existingPaperUuids = Array.isArray(paperClass.papers) ? paperClass.papers : [];

      const assigned = allSupplies.filter(supply =>
        existingPaperUuids.includes(supply.uuid)
      );
      const available = allSupplies.filter(supply =>
        !existingPaperUuids.includes(supply.uuid)
      );

      setAssignedSupplies(assigned);
      setAvailableSupplies(available);
    } catch (err: unknown) {
      logger.error('Error fetching paper supplies:', err);
      setError(t('paperClasses.loadSuppliesFailed'));
    } finally {
      setLoadingSupplies(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!paperClass) return;

    const papers = assignedSupplies.map(supply => supply.uuid);

    const formData = {
      code: data.code,
      name: data.name,
      papers,
    };

    await paperClassesApi.updatePaperClass(paperClass.uuid, formData);
    setAssignedSupplies([]);
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

  if (!paperClass) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperClasses.editTitle')} size="xl">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('paperClasses.code')}
          placeholder={t('paperClasses.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name')}
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

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('paperClasses.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditPaperClassModal;
