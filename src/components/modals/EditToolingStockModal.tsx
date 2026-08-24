import React, { useState, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ToolingStock, CreateToolingStockForm, Manufacturer, Supplier, Warehouse, Tooling, WarehouseLocation } from '../../types';
import { toolingStockApi, manufacturersApi, suppliersApi, warehousesApi, toolingsApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import WarehouseLocationSelectorModal from './WarehouseLocationSelectorModal';
import { MapPin, X } from 'lucide-react';
import { logger } from '../../utils/logger';

interface EditToolingStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolingStock: ToolingStock | null;
  onSuccess: () => void;
}

const EditToolingStockModal: React.FC<EditToolingStockModalProps> = ({
  isOpen,
  onClose,
  toolingStock,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [toolings, setToolings] = useState<Tooling[]>([]);
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      reset,
      control,
    },
    loading,
    error,
    handleSubmit,
    handleClose: modalHandleClose,
  } = useModalForm<CreateToolingStockForm>({
    onSuccess,
    onClose,
  });

  const selectedWarehouseId = useWatch({ control, name: 'warehouseUuid' });
  const selectedWarehouse = warehouses.find(w => w.uuid === selectedWarehouseId) || null;

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && toolingStock && warehouses.length > 0) {
      reset({
        warehouseUuid: toolingStock.warehouse?.uuid || '',
        toolingUuid: toolingStock.tooling?.uuid || '',
        supplierUuid: toolingStock.supplier?.uuid || '',
        manufacturerUuid: toolingStock.manufacturer?.uuid || '',
        comments: toolingStock.comments || '',
        price: toolingStock.price || undefined,
        quantity: toolingStock.quantity || 0,
      });
      setSelectedLocation(toolingStock.warehouseLocation || null);
    }
  }, [isOpen, toolingStock, warehouses, reset]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, warehousesRes, toolingsRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        warehousesApi.getWarehouses({ limit: 100, ...companyFilter }),
        toolingsApi.getToolings({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setToolings(toolingsRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  if (!toolingStock) return null;

  const onSubmit = handleSubmit((data) => {
    const stockData = {
      warehouseUuid: data.warehouseUuid,
      warehouseLocationUuid: selectedLocation?.uuid || '',
      toolingUuid: data.toolingUuid,
      supplierUuid: data.supplierUuid || '',
      manufacturerUuid: data.manufacturerUuid || '',
      comments: data.comments || undefined,
      price: data.price || undefined,
      quantity: data.quantity || 0,
    };
    return toolingStockApi.updateToolingStock(toolingStock.uuid, stockData);
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolingStock.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('toolingStock.warehouse')} *
          </label>
          <select
            {...register('warehouseUuid', {
              required: t('toolingStock.validation.warehouseRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolingStock.selectWarehouse')}</option>
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
              {t('toolingStock.warehouseLocation')}
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
                {t('toolingStock.selectLocation')}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="gd-label">
            {t('toolingStock.tooling')} *
          </label>
          <select
            {...register('toolingUuid', {
              required: t('toolingStock.validation.toolingRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolingStock.selectTooling')}</option>
            {toolings.map((tooling) => (
              <option key={tooling.uuid} value={tooling.uuid}>
                {tooling.name}
              </option>
            ))}
          </select>
          {errors.toolingUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.toolingUuid.message}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('toolingStock.supplier')}
          </label>
          <select
            {...register('supplierUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolingStock.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="gd-label">
            {t('toolingStock.manufacturer')}
          </label>
          <select
            {...register('manufacturerUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolingStock.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('toolingStock.quantity')} *
            </label>
            <Input
              type="number"
              {...register('quantity', {
                required: t('toolingStock.validation.quantityRequired'),
                valueAsNumber: true,
              })}
              placeholder={t('toolingStock.quantityPlaceholder')}
              error={errors.quantity?.message}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('toolingStock.price')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('price', {
                valueAsNumber: true,
              })}
              placeholder={t('toolingStock.pricePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="gd-label">
            {t('toolingStock.comments')}
          </label>
          <Input
            {...register('comments')}
            placeholder={t('toolingStock.commentsPlaceholder')}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('toolingStock.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditToolingStockModal;
