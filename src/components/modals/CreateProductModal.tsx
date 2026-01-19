import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProductForm, Customer } from '../../types';
import { productsApi, customersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);

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
  } = useModalForm<CreateProductForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const onSubmit = handleSubmit((data) => productsApi.createProduct(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('products.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('products.validation.codeRequired'),
            })}
            placeholder={t('products.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.clientCode')}
          </label>
          <Input
            {...register('clientCode')}
            placeholder={t('products.clientCodePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.customer')} *
          </label>
          <select
            {...register('customerId', {
              required: t('products.validation.customerRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('products.selectCustomer')}</option>
            {customers.map((customer) => (
              <option key={customer.uuid} value={customer.uuid}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.description')}
          </label>
          <textarea
            {...register('description')}
            placeholder={t('products.descriptionPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('products.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateProductModal;
