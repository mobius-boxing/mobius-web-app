import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePaperSupplyForm, Manufacturer, Supplier, PaperType } from '../../types';
import { paperSuppliesApi, manufacturersApi, suppliersApi, paperTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

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
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [manufacturersRes, suppliersRes, paperTypesRes] = await Promise.all([
        manufacturersApi.getManufacturers(),
        suppliersApi.getSuppliers(),
        paperTypesApi.getPaperTypes(),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setPaperTypes(paperTypesRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    // Transform flat form fields to API format
    const paperSupplyData = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      manufacturerId: data.manufacturerId || undefined,
      supplierId: data.supplierId || undefined,
      paperTypeId: data.paperTypeId || undefined,
      grammage: data.grammage || undefined,
      price: data.price || undefined,
      minimumStock: {
        pallets: data.minimumStockPallets || 0,
        boxes: data.minimumStockBoxes || 0,
      },
    };

    return paperSuppliesApi.createPaperSupply(paperSupplyData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperSupplies.createTitle')}>
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
              {t('paperSupplies.minimumStockPallets')}
            </label>
            <Input
              type="number"
              {...register('minimumStockPallets', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.minimumStockPalletsPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperSupplies.minimumStockBoxes')}
            </label>
            <Input
              type="number"
              {...register('minimumStockBoxes', {
                valueAsNumber: true,
              })}
              placeholder={t('paperSupplies.minimumStockBoxesPlaceholder')}
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
