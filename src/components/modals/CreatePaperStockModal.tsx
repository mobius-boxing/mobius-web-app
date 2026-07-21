import React, { useState, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreatePaperStockForm, Manufacturer, Supplier, Warehouse, PaperSupply, WarehouseLocation } from '../../types';
import { paperStockApi, manufacturersApi, suppliersApi, warehousesApi, paperSuppliesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import WarehouseLocationSelectorModal from './WarehouseLocationSelectorModal';
import { MapPin, X } from 'lucide-react';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface CreatePaperStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperStockModal: React.FC<CreatePaperStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [paperSupplies, setPaperSupplies] = useState<PaperSupply[]>([]);
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
  } = useModalForm<CreatePaperStockForm>({
    onSuccess,
    onClose,
  });

  const selectedWarehouseId = useWatch({ control, name: 'warehouseId' });
  const selectedWarehouse = warehouses.find(w => w.uuid === selectedWarehouseId) || null;

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      setSelectedLocation(null);
    }
  }, [isOpen, effectiveCompanyId]);

  useEffect(() => {
    setSelectedLocation(null);
  }, [selectedWarehouseId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, warehousesRes, paperSuppliesRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        warehousesApi.getWarehouses({ limit: 100, ...companyFilter }),
        paperSuppliesApi.getPaperSupplies({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setPaperSupplies(paperSuppliesRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const stockData = {
      warehouseId: data.warehouseId,
      warehouseLocationId: selectedLocation?.uuid || undefined,
      paperSupplyId: data.paperSupplyId,
      supplierId: data.supplierId || undefined,
      manufacturerId: data.manufacturerId || undefined,
      comments: data.comments || undefined,
      price: data.price || undefined,
      weight: data.weight || undefined,
      diameter: data.diameter || undefined,
      width: data.width || undefined,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    return paperStockApi.createPaperStock(stockData);
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperStock.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.warehouse')} *
          </label>
          <select
            {...register('warehouseId', {
              required: t('paperStock.validation.warehouseRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperStock.selectWarehouse')}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.uuid} value={warehouse.uuid}>
                {warehouse.name}
              </option>
            ))}
          </select>
          {errors.warehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
          )}
        </div>

        {selectedWarehouse && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperStock.warehouseLocation')}
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
                {t('paperStock.selectLocation')}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.paperSupply')} *
          </label>
          <select
            {...register('paperSupplyId', {
              required: t('paperStock.validation.paperSupplyRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperStock.selectPaperSupply')}</option>
            {paperSupplies.map((supply) => (
              <option key={supply.uuid} value={supply.uuid}>
                {supply.code} - {supply.name}
              </option>
            ))}
          </select>
          {errors.paperSupplyId && (
            <p className="mt-1 text-sm text-red-600">{errors.paperSupplyId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.supplier')}
          </label>
          <select
            {...register('supplierId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperStock.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.manufacturer')}
          </label>
          <select
            {...register('manufacturerId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('paperStock.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperStock.weight')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('weight', {
                valueAsNumber: true,
              })}
              placeholder={t('paperStock.weightPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperStock.diameter')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('diameter', {
                valueAsNumber: true,
              })}
              placeholder={t('paperStock.diameterPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('paperStock.width')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('width', {
                valueAsNumber: true,
              })}
              placeholder={t('paperStock.widthPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.price')}
          </label>
          <Input
            type="number"
            step="0.01"
            {...register('price', {
              valueAsNumber: true,
            })}
            placeholder={t('paperStock.pricePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperStock.comments')}
          </label>
          <Input
            {...register('comments')}
            placeholder={t('paperStock.commentsPlaceholder')}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('paperStock.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreatePaperStockModal;
