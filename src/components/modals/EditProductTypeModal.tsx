import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductType, CreateProductTypeForm } from '../../types';
import { productTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productType: ProductType | null;
}

const EditProductTypeModal: React.FC<EditProductTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productType,
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
  } = useModalForm<CreateProductTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && productType) {
      reset({
        code: productType.code,
        name: productType.name,
      });
    }
  }, [isOpen, productType, reset]);

  if (!productType) return null;

  const onSubmit = handleSubmit((data) =>
    productTypesApi.updateProductType(productType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('productTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('productTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('productTypes.validation.codeRequired'),
            })}
            placeholder={t('productTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('productTypes.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('productTypes.validation.nameRequired'),
            })}
            placeholder={t('productTypes.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('productTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditProductTypeModal;
