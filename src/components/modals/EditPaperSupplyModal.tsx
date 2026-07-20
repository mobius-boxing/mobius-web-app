import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { PaperSupply, CreatePaperSupplyForm, Manufacturer, Supplier, PaperType, FscType } from '../../types';
import { paperSuppliesApi, manufacturersApi, suppliersApi, paperTypesApi, fscTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface EditPaperSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paperSupply: PaperSupply | null;
}

const EditPaperSupplyModal: React.FC<EditPaperSupplyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paperSupply,
}) => {
  const { t } = useTranslation();
  const [fscTypes, setFscTypes] = React.useState<FscType[]>([]);
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

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
  } = useModalForm<CreatePaperSupplyForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && paperSupply) {
      setDropdownsLoaded(false);
      fetchDropdownData();
    }
  }, [isOpen, paperSupply, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && paperSupply && dropdownsLoaded) {
      reset({
        code: paperSupply.code,
        name: paperSupply.name,
        description: paperSupply.description || '',
        manufacturerId: paperSupply.manufacturer?.uuid || '',
        supplierId: paperSupply.supplier?.uuid || '',
        paperTypeId: paperSupply.paperType?.uuid || '',
        grammage: paperSupply.grammage || undefined,
        price: paperSupply.price || undefined,
        color: paperSupply.color,
        fscTypeId: paperSupply.fscType?.uuid || '',
        minimumStockWeightKg: paperSupply.minimumStock?.weightKg ?? undefined,
        minimumStockDiameterMm: paperSupply.minimumStock?.diameterMm ?? undefined,
      });
    }
  }, [isOpen, paperSupply, dropdownsLoaded, reset]);

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
    } finally {
      setDropdownsLoaded(true);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!paperSupply) return;

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
      // Omit when empty — an untouched blank select must not clear the value.
      ...(data.fscTypeId ? { fscTypeId: data.fscTypeId } : {}),
      minimumStock: {
        weightKg: data.minimumStockWeightKg ?? null,
        diameterMm: data.minimumStockDiameterMm ?? null,
      },
    };

    await paperSuppliesApi.updatePaperSupply(paperSupply.uuid, paperSupplyData);
  });

  if (!paperSupply) return null;


  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperSupplies.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperSupplies.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('paperSupplies.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
            <label className="block text-sm font-medium text-secondary-700 mb-1">
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
            <label className="block text-sm font-medium text-secondary-700 mb-1">
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
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperSupplies.color')}
            </label>
            <Input {...register('color')} placeholder={t('paperSupplies.colorPlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
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
            <label className="block text-sm font-medium text-secondary-700 mb-1">
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
            <label className="block text-sm font-medium text-secondary-700 mb-1">
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

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('paperSupplies.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditPaperSupplyModal;
