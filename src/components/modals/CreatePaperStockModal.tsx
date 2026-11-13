import React, { useState, useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreatePaperStockForm, WarehouseLocation, PaperStock } from '../../types';
import { paperStockApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createPaperStockSchema } from '../../validation/schemas/paperStock';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import WarehouseLocationSelectorModal from './WarehouseLocationSelectorModal';
import { MapPin, X } from 'lucide-react';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { EntityAutocomplete, FilterOption } from '../ui/filters';
import { usePaperStockLookups } from './paperStockLookups';

type LookupField = 'warehouseId' | 'paperSupplyId' | 'supplierId' | 'manufacturerId';

interface CreatePaperStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created?: PaperStock, printLabel?: boolean) => void;
}

const CreatePaperStockModal: React.FC<CreatePaperStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const { loaders, warehouses } = usePaperStockLookups(effectiveCompanyId ?? undefined);
  const [lookups, setLookups] = useState<Partial<Record<LookupField, FilterOption>>>({});
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [printLabel, setPrintLabel] = useState(true);
  const createdRef = useRef<PaperStock | undefined>(undefined);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      control,
      setValue,
    },
    loading,
    error,
    handleSubmit,
    handleClose: modalHandleClose,
  } = useModalForm<CreatePaperStockForm>({
    onSuccess: () => onSuccess(createdRef.current, printLabel),
    onClose,
    schema: createPaperStockSchema(t),
  });

  const selectedWarehouseId = useWatch({ control, name: 'warehouseId' });
  const selectedWarehouse = (selectedWarehouseId && warehouses.get(selectedWarehouseId)) || null;

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      setPrintLabel(true);
      setLookups({});
    }
  }, [isOpen, effectiveCompanyId]);

  useEffect(() => {
    setSelectedLocation(null);
  }, [selectedWarehouseId]);

  const pick = (field: LookupField) => (option: FilterOption | undefined) => {
    setLookups((prev) => ({ ...prev, [field]: option }));
    setValue(field, option?.value ?? '', { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
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
      barcode: data.barcode || undefined,
      deliveryNote: data.deliveryNote || undefined,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    const created = await paperStockApi.createPaperStock(stockData);
    createdRef.current = created;
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
          <label className="gd-label">{t('paperStock.barcode')}</label>
          <Input {...register('barcode')} error={errors.barcode?.message as string} placeholder={t('paperStock.barcodePlaceholder')} data-testid="paper-stock-barcode" />
        </div>

        <div>
          <label className="gd-label">{t('paperStock.deliveryNote')}</label>
          <Input {...register('deliveryNote')} error={errors.deliveryNote?.message as string} placeholder={t('paperStock.deliveryNotePlaceholder')} data-testid="paper-stock-delivery-note" />
        </div>

        <label className="flex items-center gap-2 text-sm text-secondary-700">
          <input name="printLabel" type="checkbox" checked={printLabel} onChange={(event) => setPrintLabel(event.target.checked)} data-testid="paper-stock-print-label" />
          {t('paperStock.printOnSave')}
        </label>

        <div>
          <label className="gd-label">
            {t('paperStock.warehouse')} *
          </label>
          <input type="hidden" {...register('warehouseId')} />
          <EntityAutocomplete
            data-testid="paper-stock-warehouse"
            value={lookups.warehouseId}
            onChange={pick('warehouseId')}
            loadOptions={loaders.warehouse}
            placeholder={t('paperStock.selectWarehouse')}
          />
          {errors.warehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
          )}
        </div>

        {selectedWarehouse && (
          <div>
            <label className="gd-label">
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
          <label className="gd-label">
            {t('paperStock.paperSupply')} *
          </label>
          <input type="hidden" {...register('paperSupplyId')} />
          <EntityAutocomplete
            data-testid="paper-stock-paper-supply"
            value={lookups.paperSupplyId}
            onChange={pick('paperSupplyId')}
            loadOptions={loaders.paperSupply}
            placeholder={t('paperStock.selectPaperSupply')}
          />
          {errors.paperSupplyId && (
            <p className="mt-1 text-sm text-red-600">{errors.paperSupplyId.message}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('paperStock.supplier')}
          </label>
          <input type="hidden" {...register('supplierId')} />
          <EntityAutocomplete
            data-testid="paper-stock-supplier"
            value={lookups.supplierId}
            onChange={pick('supplierId')}
            loadOptions={loaders.supplier}
            placeholder={t('paperStock.selectSupplier')}
          />
          {errors.supplierId && (
            <p className="mt-1 text-sm text-red-600">{errors.supplierId.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('paperStock.manufacturer')}
          </label>
          <input type="hidden" {...register('manufacturerId')} />
          <EntityAutocomplete
            data-testid="paper-stock-manufacturer"
            value={lookups.manufacturerId}
            onChange={pick('manufacturerId')}
            loadOptions={loaders.manufacturer}
            placeholder={t('paperStock.selectManufacturer')}
          />
          {errors.manufacturerId && (
            <p className="mt-1 text-sm text-red-600">{errors.manufacturerId.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="gd-label">
              {t('paperStock.weight')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('weight')}
              error={errors.weight?.message as string}
              placeholder={t('paperStock.weightPlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('paperStock.diameter')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('diameter')}
              error={errors.diameter?.message as string}
              placeholder={t('paperStock.diameterPlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('paperStock.width')}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('width')}
              error={errors.width?.message as string}
              placeholder={t('paperStock.widthPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="gd-label">
            {t('paperStock.price')}
          </label>
          <Input
            type="number"
            step="0.01"
            {...register('price')}
            error={errors.price?.message as string}
            placeholder={t('paperStock.pricePlaceholder')}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('paperStock.comments')}
          </label>
          <Input
            {...register('comments')}
            error={errors.comments?.message as string}
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
