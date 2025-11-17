import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreatePaperSupplyForm, Manufacturer, Supplier } from '../../types';
import { paperSuppliesApi, manufacturersApi, suppliersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePaperSupplyForm>();

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [manufacturersRes, suppliersRes] = await Promise.all([
        manufacturersApi.getManufacturers(),
        suppliersApi.getSuppliers(),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = async (data: CreatePaperSupplyForm) => {
    setLoading(true);
    setError('');

    try {
      // Transform flat form fields to API format
      const paperSupplyData = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        manufacturerId: data.manufacturerId || undefined,
        supplierId: data.supplierId || undefined,
        minimumStock: {
          pallets: data.minimumStockPallets || 0,
          boxes: data.minimumStockBoxes || 0,
        },
      };

      await paperSuppliesApi.createPaperSupply(paperSupplyData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating paper supply:', err);
      setError(
        err.response?.data?.message ||
        t('paperSupplies.createFailed')
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperSupplies.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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
            {loading ? t('common.loading') : t('paperSupplies.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePaperSupplyModal;
