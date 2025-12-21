import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Product, CreateProductForm, Customer } from '../../types';
import { productsApi, customersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductForm>();

  useEffect(() => {
    if (isOpen && product) {
      setDropdownsLoaded(false);
      fetchCustomers();
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen && product && dropdownsLoaded) {
      reset({
        code: product.code,
        clientCode: product.clientCode || '',
        description: product.description || '',
        customerId: product.customerId,
      });
    }
  }, [isOpen, product, dropdownsLoaded, reset]);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  const onSubmit = async (data: CreateProductForm) => {
    if (!product) return;

    setLoading(true);
    setError('');

    try {
      await productsApi.updateProduct(product.uuid, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(
        err.response?.data?.message ||
        t('products.updateFailed')
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

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('products.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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
            {loading ? t('common.loading') : t('products.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
