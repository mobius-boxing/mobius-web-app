import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateSupplierForm } from '../../types';
import { suppliersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();

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
  } = useModalForm<CreateSupplierForm>({
    defaultValues: {
      suppliesSheets: false,
      suppliesElaborated: false,
      suppliesConsumables: false,
      suppliesPaper: false,
      suppliesTooling: false,
    },
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => suppliersApi.createSupplier(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('suppliers.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('suppliers.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('suppliers.validation.codeRequired'),
            })}
            placeholder={t('suppliers.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-secondary-700">
            {t('suppliers.supplyTypes')}
          </label>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesSheets')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.sheets')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesElaborated')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.elaborated')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesConsumables')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.consumables')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesPaper')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.paper')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('suppliesTooling')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="ml-2 text-sm text-secondary-700">{t('suppliers.fields.tooling')}</span>
            </label>
          </div>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('suppliers.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateSupplierModal;
