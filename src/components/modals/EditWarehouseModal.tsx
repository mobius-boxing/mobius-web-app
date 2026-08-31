import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, CreateWarehouseForm } from '../../types';
import { warehousesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editWarehouseSchema } from '../../validation/schemas/warehouse';

interface EditWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouse: Warehouse | null;
}

const EditWarehouseModal: React.FC<EditWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  warehouse,
}) => {
  const { t } = useTranslation();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      reset,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateWarehouseForm>({
    onSuccess,
    onClose,
    schema: editWarehouseSchema(t),
  });

  useEffect(() => {
    if (isOpen && warehouse) {
      reset({
        name: warehouse.name,
      });
    }
  }, [isOpen, warehouse, reset]);

  if (!warehouse) return null;

  const onSubmit = handleSubmit((data) =>
    warehousesApi.updateWarehouse(warehouse.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('warehouses.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('warehouses.name')} *
          </label>
          <Input
            {...register('name')}
            placeholder={t('warehouses.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            To resize the grid, use the Grid Editor (grid icon) which allows you to configure locations after resizing.
          </p>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('warehouses.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditWarehouseModal;
