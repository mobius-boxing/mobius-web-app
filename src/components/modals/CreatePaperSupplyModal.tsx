import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePaperSupplyForm, Manufacturer, Supplier, PaperType, FscType } from '../../types';
import { paperSuppliesApi, manufacturersApi, suppliersApi, paperTypesApi, fscTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface CreatePaperSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperSupplyModal: React.FC<CreatePaperSupplyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [fscTypes, setFscTypes] = React.useState<FscType[]>([]);
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);

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
  } = useModalForm<CreatePaperSupplyForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, effectiveCompanyId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, paperTypesRes, fscTypesRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        paperTypesApi.getPaperTypes({ limit: 100, ...companyFilter }),
        fscTypesApi.getFscTypes({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setPaperTypes(paperTypesRes.data || []);
      setFscTypes(fscTypesRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const paperSupplyData = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      manufacturerId: data.manufacturerId || undefined,
      supplierId: data.supplierId || undefined,
      paperTypeId: data.paperTypeId || undefined,
      grammage: data.grammage || undefined,
      price: data.price || undefined,
      color: data.color || undefined,
      fscTypeId: data.fscTypeId || undefined,
      minimumStock: {
        weightKg: data.minimumStockWeightKg ?? null,
        diameterMm: data.minimumStockDiameterMm ?? null,
      },
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };

    return paperSuppliesApi.createPaperSupply(paperSupplyData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperSupplies.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('paperSupplies.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('paperSupplies.validation.codeRequired'),
            })}
            placeholder={t('paperSupplies.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSupplies.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('paperSupplies.validation.nameRequired'),
            })}
            placeholder={t('paperSupplies.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSupplies.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('paperSupplies.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperSupplies.manufacturer')}
          </label>
          <select
            {...register('manufacturerId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSupplies.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="gd-label">
            {t('paperSupplies.supplier')}
          </label>
          <select
            {...register('supplierId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSupplies.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="gd-label">
            {t('paperSupplies.paperType')}
          </label>
          <select
            {...register('paperTypeId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperSupplies.selectPaperType')}</option>
            {paperTypes.map((paperType) => (
              <option key={paperType.uuid} value={paperType.uuid}>
                {paperType.code}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('paperSupplies.grammage')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('grammage', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.grammagePlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('paperSupplies.price')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('price', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.pricePlaceholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('paperSupplies.color')}
            </label>
            <Input {...register('color')} placeholder={t('paperSupplies.colorPlaceholder')} />
          </div>

          <div>
            <label className="gd-label">
              {t('paperSupplies.fscType')}
            </label>
            <select
              {...register('fscTypeId')}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('paperSupplies.selectFscType')}</option>
              {fscTypes.map((ft) => (
                <option key={ft.uuid} value={ft.uuid}>
                  {ft.code}{ft.description ? ` - ${ft.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('paperSupplies.minimumStockWeightKg')}
            </label>
            <Input
              type="number"
              step="any"
              {...register('minimumStockWeightKg', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.minimumStockWeightKgPlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('paperSupplies.minimumStockDiameterMm')}
            </label>
            <Input
              type="number"
              step="any"
              {...register('minimumStockDiameterMm', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.minimumStockDiameterMmPlaceholder')}
            />
          </div>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('paperSupplies.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreatePaperSupplyModal;
