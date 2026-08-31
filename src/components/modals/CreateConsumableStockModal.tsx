import React, { useState, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateConsumableStockForm, Manufacturer, Supplier, Warehouse, ConsumableSupply, WarehouseLocation } from '../../types';
import { consumableStockApi, manufacturersApi, suppliersApi, warehousesApi, consumableSuppliesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createConsumableStockSchema } from '../../validation/schemas/consumableStock';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import WarehouseLocationSelectorModal from './WarehouseLocationSelectorModal';
import { MapPin, X } from 'lucide-react';
import { logger } from '../../utils/logger';

interface CreateConsumableStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateConsumableStockModal: React.FC<CreateConsumableStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [consumableSupplies, setConsumableSupplies] = useState<ConsumableSupply[]>([]);
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      control,
    },
    loading,
    error,
    handleSubmit,
    handleClose: modalHandleClose,
  } = useModalForm<CreateConsumableStockForm>({
    onSuccess,
    onClose,
    schema: createConsumableStockSchema(t),
  });

  const selectedWarehouseId = useWatch({ control, name: 'warehouseUuid' });
  const selectedWarehouse = warehouses.find(w => w.uuid === selectedWarehouseId) || null;

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      setSelectedLocation(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedLocation(null);
  }, [selectedWarehouseId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, warehousesRes, consumableSuppliesRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        warehousesApi.getWarehouses({ limit: 100, ...companyFilter }),
        consumableSuppliesApi.getConsumableSupplies({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setConsumableSupplies(consumableSuppliesRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const stockData = {
      warehouseUuid: data.warehouseUuid,
      warehouseLocationUuid: selectedLocation?.uuid || undefined,
      consumableSupplyUuid: data.consumableSupplyUuid,
      supplierUuid: data.supplierUuid || undefined,
      manufacturerUuid: data.manufacturerUuid || undefined,
      comments: data.comments || undefined,
      price: data.price || undefined,
      quantity: data.quantity || 0,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    return consumableStockApi.createConsumableStock(stockData);
  });

  const handleClose = () => {
    setSelectedLocation(null);
    modalHandleClose();
  };

  const handleLocationSelect = (location: WarehouseLocation) => {
    setSelectedLocation(location);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
  };

  if (locationSelectorOpen && selectedWarehouse) {
    return (
      <WarehouseLocationSelectorModal
        isOpen={true}
        onClose={() => setLocationSelectorOpen(false)}
        onSelect={handleLocationSelect}
        warehouse={selectedWarehouse}
        currentLocationUuid={selectedLocation?.uuid}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('consumableStock.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('consumableStock.warehouse')} *
          </label>
          <select
            {...register('warehouseUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableStock.selectWarehouse')}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.uuid} value={warehouse.uuid}>
                {warehouse.name}
              </option>
            ))}
          </select>
          {errors.warehouseUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.warehouseUuid.message}</p>
          )}
        </div>

        {selectedWarehouse && (
          <div>
            <label className="gd-label">
              {t('consumableStock.warehouseLocation')}
            </label>
            {selectedLocation ? (
              <div className="flex items-center gap-2 p-2 bg-primary-50 border border-primary-200 rounded-md">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span className="flex-1 text-sm text-primary-800 font-medium">
                  {selectedLocation.locationCode}
                </span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLocationSelectorOpen(true)}
                  className="text-xs text-primary-600 hover:text-primary-800 underline"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLocationSelectorOpen(true)}
                className="w-full px-3 py-2 border border-dashed border-secondary-300 rounded-md text-secondary-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                {t('consumableStock.selectLocation')}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="gd-label">
            {t('consumableStock.consumableSupply')} *
          </label>
          <select
            {...register('consumableSupplyUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableStock.selectConsumableSupply')}</option>
            {consumableSupplies.map((supply) => (
              <option key={supply.uuid} value={supply.uuid}>
                {supply.code} - {supply.name}
              </option>
            ))}
          </select>
          {errors.consumableSupplyUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.consumableSupplyUuid.message}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('consumableStock.supplier')}
          </label>
          <select
            {...register('supplierUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableStock.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
          {errors.supplierUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.supplierUuid.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('consumableStock.manufacturer')}
          </label>
          <select
            {...register('manufacturerUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableStock.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
          {errors.manufacturerUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.manufacturerUuid.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('consumableStock.quantity')} *
            </label>
            <Input
              type="number"
              {...register('quantity')}
              placeholder={t('consumableStock.quantityPlaceholder')}
              error={errors.quantity?.message}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('consumableStock.price')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('price')}
              error={errors.price?.message as string}
              placeholder={t('consumableStock.pricePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="gd-label">
            {t('consumableStock.comments')}
          </label>
          <Input
            {...register('comments')}
            error={errors.comments?.message as string}
            placeholder={t('consumableStock.commentsPlaceholder')}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('consumableStock.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateConsumableStockModal;
