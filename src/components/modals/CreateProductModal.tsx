import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProductForm, Customer, ProductType, BoxType, Corrugation, ProductionRoute } from '../../types';
import { productsApi, customersApi, productTypesApi, boxTypesApi, corrugationsApi, productionRoutesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import FileRefUploader from '../ui/FileRefUploader';
import { logger } from '../../utils/logger';

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
  const { effectiveCompanyId } = useEffectiveCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  // Simple = product + its first part inline (ProductoSimpleForm; the live
  // customer's universal case). Compuesto = product only, parts added on edit.
  const [mode, setMode] = useState<'simple' | 'composite'>('simple');
  const [corrugations, setCorrugations] = useState<Corrugation[]>([]);
  const [globalRoutes, setGlobalRoutes] = useState<ProductionRoute[]>([]);
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
      setMode('simple');
      fetchDropdownData();
    }
  }, [isOpen, effectiveCompanyId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [customersRes, productTypesRes, boxTypesRes, corrugationsRes, routesRes] = await Promise.all([
        customersApi.getCustomers({ limit: 100, ...companyFilter }),
        productTypesApi.getProductTypes({ limit: 100, ...companyFilter }),
        boxTypesApi.getBoxTypes({ limit: 100, ...companyFilter }),
        corrugationsApi.getCorrugations({ limit: 100, ...companyFilter }),
        productionRoutesApi.getRoutes({ limit: 100, isGlobal: true, ...companyFilter }),
      ]);
      setCustomers(customersRes.data || []);
      setProductTypes(productTypesRes.data || []);
      setBoxTypes(boxTypesRes.data || []);
      setCorrugations(corrugationsRes.data || []);
      setGlobalRoutes(routesRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const payload: CreateProductForm = {
      ...data,
      ...fileUuids,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    if (mode === 'composite') delete payload.initialPart;
    return productsApi.createProduct(payload);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('products.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        {/* Simple vs Compuesto (module 06: a product is 1..N parts) */}
        <div className="flex rounded-md border border-secondary-300 overflow-hidden">
          {(['simple', 'composite'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 text-sm font-medium ${
                mode === m
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-secondary-700 hover:bg-secondary-50'
              }`}
            >
              {t(`products.mode.${m}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-secondary-500 -mt-2">
          {t(`products.mode.${mode}Hint`)}
        </p>

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
              defaultValue={0}
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

        {mode === 'simple' && (
          <div className="rounded-md border border-secondary-200 bg-secondary-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-secondary-900">
              {t('products.initialPart.title')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('products.initialPart.corrugation')} *
              </label>
              <select
                {...register('initialPart.corrugationUuid', {
                  required: mode === 'simple' ? t('products.initialPart.validation.corrugationRequired') : false,
                })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.selectCorrugation')}</option>
                {corrugations.map((co) => (
                  <option key={co.uuid} value={co.uuid}>
                    {co.code}{co.description ? ` - ${co.description}` : ''}
                  </option>
                ))}
              </select>
              {(errors as any).initialPart?.corrugationUuid && (
                <p className="mt-1 text-sm text-red-600">
                  {(errors as any).initialPart.corrugationUuid.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {t('products.initialPart.sheetLength')} *
                </label>
                <Input
                  type="number"
                  step="any"
                  {...register('initialPart.sheetLength', {
                    valueAsNumber: true,
                    required: mode === 'simple' ? t('products.initialPart.validation.sheetDimsRequired') : false,
                    min: { value: 0.001, message: t('products.initialPart.validation.sheetDimsRequired') },
                  })}
                  error={(errors as any).initialPart?.sheetLength?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {t('products.initialPart.sheetWidth')} *
                </label>
                <Input
                  type="number"
                  step="any"
                  {...register('initialPart.sheetWidth', {
                    valueAsNumber: true,
                    required: mode === 'simple' ? t('products.initialPart.validation.sheetDimsRequired') : false,
                    min: { value: 0.001, message: t('products.initialPart.validation.sheetDimsRequired') },
                  })}
                  error={(errors as any).initialPart?.sheetWidth?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(['boxLength', 'boxWidth', 'boxHeight'] as const).map((f) => (
                // flex-col + flex-1 label: inputs stay bottom-aligned even when
                // one label wraps to more lines than its siblings.
                <div key={f} className="flex flex-col">
                  <label className="block flex-1 text-sm font-medium text-secondary-700 mb-1">
                    {t(`products.initialPart.${f}`)}
                  </label>
                  <Input type="number" step="any" {...register(`initialPart.${f}` as any, { valueAsNumber: true })} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('products.initialPart.route')}
              </label>
              <select
                {...register('initialPart.productionRouteUuid')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.rutaPropia')}</option>
                {globalRoutes.map((r) => (
                  <option key={r.uuid} value={r.uuid}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-secondary-500">{t('products.initialPart.rutaPropiaHint')}</p>
            </div>
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
