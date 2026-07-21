import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { Product, CreateProductForm, Customer, ProductType, BoxType } from '../../types';
import { productsApi, customersApi, productTypesApi, boxTypesApi, partsApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import FileRefUploader from '../ui/FileRefUploader';
import ProductApprovalWidget from '../forms/ProductApprovalWidget';
import PartsGrid from '../parts/PartsGrid';
import { logger } from '../../utils/logger';

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
  // Simple (1 parte) / Compuesto (N) badge + empty-state prompt.
  const [partsCount, setPartsCount] = useState<number | null>(null);

  const refreshPartsCount = React.useCallback(() => {
    if (!product?.uuid) return;
    partsApi
      .getPartsForProduct(product.uuid, { limit: 1 })
      .then((r) => setPartsCount(r.total ?? 0))
      .catch(() => setPartsCount(null));
  }, [product?.uuid]);

  useEffect(() => {
    if (isOpen && product?.uuid) refreshPartsCount();
    else setPartsCount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.uuid]);
  const { effectiveCompanyId } = useEffectiveCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  const [approvalState, setApprovalState] = useState<Product | null>(null);
  const [fileUuids, setFileUuids] = useState<{
    technicalSheetFileUuid: string | null;
    blueprintFileUuid: string | null;
    sketchFileUuid: string | null;
    imageFileUuid: string | null;
  }>({ technicalSheetFileUuid: null, blueprintFileUuid: null, sketchFileUuid: null, imageFileUuid: null });

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
  } = useModalForm<CreateProductForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && product) {
      setDropdownsLoaded(false);
      fetchDropdownData();
    }
  }, [isOpen, product, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && product && dropdownsLoaded) {
      reset({
        code: product.code,
        clientCode: product.clientCode || '',
        description: product.description || '',
        customerId: product.customer?.uuid || '',
        revision: product.revision ?? 0,
        vip: product.vip ?? false,
        productTypeId: product.productType?.uuid || '',
        boxTypeId: product.boxType?.uuid || '',
      });
      setApprovalState(product);
      setFileUuids({
        technicalSheetFileUuid: product.technicalSheetFileUuid ?? null,
        blueprintFileUuid: product.blueprintFileUuid ?? null,
        sketchFileUuid: product.sketchFileUuid ?? null,
        imageFileUuid: product.imageFileUuid ?? null,
      });
    }
  }, [isOpen, product, dropdownsLoaded, reset]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [customersRes, productTypesRes, boxTypesRes] = await Promise.all([
        customersApi.getCustomers({ limit: 100, ...companyFilter }),
        productTypesApi.getProductTypes({ limit: 100, ...companyFilter }),
        boxTypesApi.getBoxTypes({ limit: 100, ...companyFilter }),
      ]);
      setCustomers(customersRes.data || []);
      setProductTypes(productTypesRes.data || []);
      setBoxTypes(boxTypesRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!product) return;
    await productsApi.updateProduct(product.uuid, { ...data, ...fileUuids });
  });

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('products.editTitle')}>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('products.revision')}
            </label>
            <Input
              type="number"
              {...register('revision', { valueAsNumber: true })}
              placeholder={t('products.revisionPlaceholder')}
            />
          </div>

          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              {...register('vip')}
              className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <label className="ml-2 text-sm font-medium text-secondary-700">
              {t('products.vip')}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.productType')}
          </label>
          <select
            {...register('productTypeId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('products.selectProductType')}</option>
            {productTypes.map((pt) => (
              <option key={pt.uuid} value={pt.uuid}>
                {pt.code} - {pt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('products.boxType')}
          </label>
          <select
            {...register('boxTypeId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('products.selectBoxType')}</option>
            {boxTypes.map((bt) => (
              <option key={bt.uuid} value={bt.uuid}>
                {bt.code} - {bt.name}
              </option>
            ))}
          </select>
        </div>

        {approvalState && (
          <ProductApprovalWidget product={approvalState} onChanged={setApprovalState} />
        )}

        {product?.uuid && (
          <div className="mt-4 border-t border-secondary-200 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-secondary-900">{t('parts.embedded.title')}</h3>
              {partsCount !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    partsCount === 0
                      ? 'bg-amber-100 text-amber-800'
                      : partsCount === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {partsCount === 0
                    ? t('products.mode.noParts')
                    : partsCount === 1
                      ? t('products.mode.simpleBadge')
                      : t('products.mode.compositeBadge', { count: partsCount })}
                </span>
              )}
            </div>
            {partsCount === 0 && (
              <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t('products.mode.noPartsHint')}
              </p>
            )}
            <PartsGrid productUuid={product.uuid} compact onPartsChanged={refreshPartsCount} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileRefUploader
            value={fileUuids.technicalSheetFileUuid}
            onChange={(uuid) => setFileUuids((s) => ({ ...s, technicalSheetFileUuid: uuid }))}
            label={t('products.files.technicalSheet')}
          />
          <FileRefUploader
            value={fileUuids.blueprintFileUuid}
            onChange={(uuid) => setFileUuids((s) => ({ ...s, blueprintFileUuid: uuid }))}
            label={t('products.files.blueprint')}
          />
          <FileRefUploader
            value={fileUuids.sketchFileUuid}
            onChange={(uuid) => setFileUuids((s) => ({ ...s, sketchFileUuid: uuid }))}
            label={t('products.files.sketch')}
          />
          <FileRefUploader
            value={fileUuids.imageFileUuid}
            onChange={(uuid) => setFileUuids((s) => ({ ...s, imageFileUuid: uuid }))}
            label={t('products.files.image')}
            accept="image/*"
          />
        </div>

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('products.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditProductModal;
