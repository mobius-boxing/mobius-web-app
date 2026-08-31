import React, { useState, useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateSheetStockForm, SheetStock, Manufacturer, Supplier, Warehouse, PaperSheet, WarehouseLocation } from '../../types';
import { sheetStockApi, manufacturersApi, suppliersApi, warehousesApi, paperSheetsApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import WarehouseLocationSelectorModal from './WarehouseLocationSelectorModal';
import { useModalForm } from '../../hooks/useModalForm';
import { editSheetStockSchema } from '../../validation/schemas/sheetStock';
import { MapPin, X } from 'lucide-react';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface EditSheetStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sheetStock: SheetStock | null;
}

const EditSheetStockModal: React.FC<EditSheetStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sheetStock,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [paperSheets, setPaperSheets] = useState<PaperSheet[]>([]);
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const {
    form,
    loading,
    error,
    handleSubmit,
    handleClose: baseHandleClose,
  } = useModalForm<CreateSheetStockForm>({
    onSuccess,
    onClose,
    schema: editSheetStockSchema(t),
  });

  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors },
    reset,
    control,
  } = form;

  const selectedWarehouseId = useWatch({ control, name: 'warehouseId' });
  const selectedWarehouse = warehouses.find(w => w.uuid === selectedWarehouseId) || null;

  const previousWarehouseId = useRef(selectedWarehouseId);

  useEffect(() => {
    if (isOpen && sheetStock) {
      setDropdownsLoaded(false);
      fetchDropdownData();
    }
  }, [isOpen, sheetStock, effectiveCompanyId]);

  useEffect(() => {
    if (sheetStock && isOpen && dropdownsLoaded) {
      reset({
        warehouseId: sheetStock.warehouse?.uuid || '',
        paperSheetId: sheetStock.paperSheet?.uuid || '',
        supplierId: sheetStock.supplier?.uuid || '',
        manufacturerId: sheetStock.manufacturer?.uuid || '',
        comments: sheetStock.comments || '',
        price: sheetStock.price || undefined,
        quantity: sheetStock.quantity || 0,
      });
      setSelectedLocation(sheetStock.warehouseLocation || null);
    }
  }, [sheetStock, isOpen, dropdownsLoaded, reset]);

  useEffect(() => {
    if (previousWarehouseId.current && selectedWarehouseId !== previousWarehouseId.current) {
      setSelectedLocation(null);
    }
    previousWarehouseId.current = selectedWarehouseId;
  }, [selectedWarehouseId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [manufacturersRes, suppliersRes, warehousesRes, paperSheetsRes] = await Promise.all([
        manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }),
        suppliersApi.getSuppliers({ limit: 100, ...companyFilter }),
        warehousesApi.getWarehouses({ limit: 100, ...companyFilter }),
        paperSheetsApi.getPaperSheets({ limit: 100, ...companyFilter }),
      ]);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setPaperSheets(paperSheetsRes.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);
    baseHandleClose();
  };

  const handleLocationSelect = (location: WarehouseLocation) => {
    setSelectedLocation(location);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
  };

  if (!sheetStock) return null;

  const onSubmit = handleSubmit(async (data) => {
    const stockData = {
      warehouseId: data.warehouseId,
      warehouseLocationId: selectedLocation?.uuid || undefined,
      paperSheetId: data.paperSheetId,
      supplierId: data.supplierId || undefined,
      manufacturerId: data.manufacturerId || undefined,
      comments: data.comments || undefined,
      price: data.price || undefined,
      quantity: data.quantity || 0,
    };

    await sheetStockApi.updateSheetStock(sheetStock.uuid, stockData);
  });

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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('sheetStock.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('sheetStock.warehouse')} *
          </label>
          <select
            {...register('warehouseId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('sheetStock.selectWarehouse')}</option>
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
            <label className="gd-label">
              {t('sheetStock.warehouseLocation')}
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
                {t('sheetStock.selectLocation')}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="gd-label">
            {t('sheetStock.paperSheet')} *
          </label>
          <select
            {...register('paperSheetId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('sheetStock.selectPaperSheet')}</option>
            {paperSheets.map((sheet) => (
              <option key={sheet.uuid} value={sheet.uuid}>
                {sheet.code} - {sheet.name}
              </option>
            ))}
          </select>
          {errors.paperSheetId && (
            <p className="mt-1 text-sm text-red-600">{errors.paperSheetId.message}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('sheetStock.supplier')}
          </label>
          <select
            {...register('supplierId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('sheetStock.selectSupplier')}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.uuid} value={supplier.uuid}>
                {supplier.code}
              </option>
            ))}
          </select>
          {errors.supplierId && (
            <p className="mt-1 text-sm text-red-600">{errors.supplierId.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('sheetStock.manufacturer')}
          </label>
          <select
            {...register('manufacturerId')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('sheetStock.selectManufacturer')}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.uuid} value={manufacturer.uuid}>
                {manufacturer.name}
              </option>
            ))}
          </select>
          {errors.manufacturerId && (
            <p className="mt-1 text-sm text-red-600">{errors.manufacturerId.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('sheetStock.quantity')} *
            </label>
            <Input
              type="number"
              {...register('quantity')}
              placeholder={t('sheetStock.quantityPlaceholder')}
              error={errors.quantity?.message}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('sheetStock.price')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('price')}
              error={errors.price?.message as string}
              placeholder={t('sheetStock.pricePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="gd-label">
            {t('sheetStock.comments')}
          </label>
          <Input
            {...register('comments')}
            error={errors.comments?.message as string}
            placeholder={t('sheetStock.commentsPlaceholder')}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('sheetStock.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditSheetStockModal;
