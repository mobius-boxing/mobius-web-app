import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProductForm, Customer, Corrugation, ProductionRoute, Model, FlapType, GlueType } from '../../types';
import { productsApi, customersApi, corrugationsApi, productionRoutesApi, modelsApi, flapTypesApi, glueTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { createProductSchema } from '../../validation/schemas/product';
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
  const [models, setModels] = useState<Model[]>([]);
  const [flapTypes, setFlapTypes] = useState<FlapType[]>([]);
  const [glueTypes, setGlueTypes] = useState<GlueType[]>([]);
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
    schema: createProductSchema(t),
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
      const [customersRes, corrugationsRes, routesRes, modelsRes, flapTypesRes, glueTypesRes] = await Promise.all([
        customersApi.getCustomers({ limit: 100, ...companyFilter }),
        corrugationsApi.getCorrugations({ limit: 100, ...companyFilter }),
        productionRoutesApi.getRoutes({ limit: 100, isGlobal: true, ...companyFilter }),
        modelsApi.getModels({ limit: 100, ...companyFilter }),
        flapTypesApi.getFlapTypes({ limit: 100, ...companyFilter }),
        glueTypesApi.getGlueTypes({ limit: 100, ...companyFilter }),
      ]);
      setCustomers(customersRes.data || []);
      setCorrugations(corrugationsRes.data || []);
      setGlobalRoutes(routesRes.data || []);
      setModels(modelsRes.data || []);
      setFlapTypes(flapTypesRes.data || []);
      setGlueTypes(glueTypesRes.data || []);
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
          <label className="gd-label">
            {t('products.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('products.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('products.clientCode')}
          </label>
          <Input
            {...register('clientCode')}
            error={errors.clientCode?.message as string}
            placeholder={t('products.clientCodePlaceholder')}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('products.customer')} *
          </label>
          <select
            {...register('customerId')}
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
          <label className="gd-label">
            {t('products.description')}
          </label>
          <textarea
            {...register('description')}
            placeholder={t('products.descriptionPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('products.revision')}
            </label>
            <Input
              type="number"
              {...register('revision')}
              error={errors.revision?.message as string}
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

        {mode === 'simple' && (
          <div className="rounded-md border border-secondary-200 bg-secondary-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-secondary-900">
              {t('products.initialPart.title')}
            </h3>

            <div>
              <label className="gd-label">
                {t('products.initialPart.corrugation')} *
              </label>
              <select
                {...register('initialPart.corrugationUuid')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.selectCorrugation')}</option>
                {corrugations.map((co) => (
                  <option key={co.uuid} value={co.uuid}>
                    {co.code}{co.description ? ` - ${co.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.initialPart?.corrugationUuid && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPart?.corrugationUuid.message as string}</p>
              )}
              {(errors as any).initialPart?.corrugationUuid && (
                <p className="mt-1 text-sm text-red-600">
                  {(errors as any).initialPart.corrugationUuid.message}
                </p>
              )}
            </div>

            {/* Optional part references (nullable FKs on `parts`). */}
            <div>
              <label className="gd-label">
                {t('products.initialPart.model')}
              </label>
              <select
                {...register('initialPart.modelUuid')}
                data-testid="initial-part-model"
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.selectModel')}</option>
                {models.map((mo) => (
                  <option key={mo.uuid} value={mo.uuid}>
                    {[mo.code, mo.description].filter(Boolean).join(' - ')}
                  </option>
                ))}
              </select>
              {errors.initialPart?.modelUuid && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPart?.modelUuid.message as string}</p>
              )}
            </div>

            <div>
              <label className="gd-label">
                {t('products.initialPart.flapType')}
              </label>
              <select
                {...register('initialPart.flapTypeUuid')}
                data-testid="initial-part-flap-type"
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.selectFlapType')}</option>
                {flapTypes.map((ft) => (
                  <option key={ft.uuid} value={ft.uuid}>
                    {ft.code}{ft.description ? ` - ${ft.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.initialPart?.flapTypeUuid && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPart?.flapTypeUuid.message as string}</p>
              )}
            </div>

            <div>
              <label className="gd-label">
                {t('products.initialPart.glueType')}
              </label>
              <select
                {...register('initialPart.glueTypeUuid')}
                data-testid="initial-part-glue-type"
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('products.initialPart.selectGlueType')}</option>
                {glueTypes.map((gt) => (
                  <option key={gt.uuid} value={gt.uuid}>
                    {gt.code}{gt.description ? ` - ${gt.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.initialPart?.glueTypeUuid && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPart?.glueTypeUuid.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="gd-label">
                  {t('products.initialPart.sheetLength')} *
                </label>
                <Input
                  type="number"
                  step="any"
                  {...register('initialPart.sheetLength')}
                  error={(errors as any).initialPart?.sheetLength?.message}
                />
              </div>
              <div>
                <label className="gd-label">
                  {t('products.initialPart.sheetWidth')} *
                </label>
                <Input
                  type="number"
                  step="any"
                  {...register('initialPart.sheetWidth')}
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
              <label className="gd-label">
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
              {errors.initialPart?.productionRouteUuid && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPart?.productionRouteUuid.message as string}</p>
              )}
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
