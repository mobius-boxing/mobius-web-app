import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateWarehouseForm } from '../../types';
import { warehousesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createWarehouseSchema } from '../../validation/schemas/warehouse';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

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

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateWarehouseForm>({
    defaultValues: {
      gridRows: 10,
      gridCols: 10,
    },
    onSuccess,
    onClose,
    schema: createWarehouseSchema(t),
  });

  const onSubmit = handleSubmit((data) =>
    warehousesApi.createWarehouse({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('warehouses.createTitle')}>
      <form
        onSubmit={formSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
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

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="gd-label">
                {t('warehouses.gridRows')} *
              </label>
              <Input
                type="number"
                {...register('gridRows')}
                placeholder="10"
                defaultValue={10}
                error={errors.gridRows?.message}
              />
            </div>
            <div>
              <label className="gd-label">
                {t('warehouses.gridCols')} *
              </label>
              <Input
                type="number"
                {...register('gridCols')}
                placeholder="10"
                defaultValue={10}
                error={errors.gridCols?.message}
              />
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            {t('warehouses.gridSizeInfo')}
          </p>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('warehouses.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateWarehouseModal;
