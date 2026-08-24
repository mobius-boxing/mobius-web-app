import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsumableSupply, CreateConsumableSupplyForm, ConsumableType, Manufacturer, Supplier, Color } from '../../types';
import { consumableSuppliesApi, consumableTypesApi, manufacturersApi, suppliersApi, colorsApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditConsumableSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumableSupply: ConsumableSupply | null;
  onSuccess: () => void;
}

const EditConsumableSupplyModal: React.FC<EditConsumableSupplyModalProps> = ({
  isOpen,
  onClose,
  consumableSupply,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [colorOptions, setColorOptions] = React.useState<Color[]>([]);
  const { effectiveCompanyId } = useEffectiveCompany();
  const [consumableTypes, setConsumableTypes] = useState<ConsumableType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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
  } = useModalForm<CreateConsumableSupplyForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      consumableTypesApi.getConsumableTypes({ limit: 100, ...companyFilter }).then((res) => setConsumableTypes(res.data));
      manufacturersApi.getManufacturers({ limit: 100, ...companyFilter }).then((res) => setManufacturers(res.data));
      suppliersApi.getSuppliers({ limit: 100, ...companyFilter }).then((res) => setSuppliers(res.data));
      colorsApi
        .getColors({ limit: 100, ...companyFilter })
        .then((res) => setColorOptions(res.data))
        .catch(() => setColorOptions([]));
    }
  }, [isOpen, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && consumableSupply) {
      reset({
        code: consumableSupply.code,
        name: consumableSupply.name,
        description: consumableSupply.description || '',
        consumableTypeUuid: consumableSupply.consumableType?.uuid || '',
        manufacturerUuid: consumableSupply.manufacturer?.uuid || '',
        supplierUuid: consumableSupply.supplier?.uuid || '',
        location: consumableSupply.location,
        expiry: consumableSupply.expiry,
        minimumStock: consumableSupply.minimumStock ?? undefined,
        colorUuid: consumableSupply.color?.uuid || '',
      });
    }
  }, [isOpen, consumableSupply, reset]);

  if (!consumableSupply) return null;

  const onSubmit = handleSubmit((data) => {
    // Omit colorUuid when empty — an untouched blank select must not clear it.
    const { colorUuid, ...rest } = data;
    return consumableSuppliesApi.updateConsumableSupply(consumableSupply.uuid, {
      ...rest,
      ...(colorUuid ? { colorUuid } : {}),
    });
  });


  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('consumableSupplies.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code', {
            required: t('consumableSupplies.validation.codeRequired'),
          })}
          label={t('consumableSupplies.code')}
          placeholder={t('consumableSupplies.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name', {
            required: t('consumableSupplies.validation.nameRequired'),
          })}
          label={t('consumableSupplies.name')}
          placeholder={t('consumableSupplies.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('consumableSupplies.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('consumableSupplies.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('consumableSupplies.consumableType')} *
          </label>
          <select
            {...register('consumableTypeUuid', {
              required: t('consumableSupplies.validation.consumableTypeRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableSupplies.selectConsumableType')}</option>
            {consumableTypes.map((ct) => (
              <option key={ct.uuid} value={ct.uuid}>
                {ct.name} ({ct.code})
              </option>
            ))}
          </select>
          {errors.consumableTypeUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.consumableTypeUuid.message}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
            {t('consumableSupplies.manufacturer')}
          </label>
          <select
            {...register('manufacturerUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableSupplies.selectManufacturer')}</option>
            {manufacturers.map((m) => (
              <option key={m.uuid} value={m.uuid}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="gd-label">
            {t('consumableSupplies.supplier')}
          </label>
          <select
            {...register('supplierUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('consumableSupplies.selectSupplier')}</option>
            {suppliers.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.code}
              </option>
            ))}
          </select>
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('consumableSupplies.location')}
            </label>
            <Input {...register('location')} placeholder={t('consumableSupplies.locationPlaceholder')} />
          </div>

          <div>
            <label className="gd-label">
              {t('consumableSupplies.expiry')}
            </label>
            <Input {...register('expiry')} placeholder={t('consumableSupplies.expiryPlaceholder')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="gd-label">
              {t('consumableSupplies.minimumStock')}
            </label>
            <Input
              type="number"
              step="any"
              {...register('minimumStock', { valueAsNumber: true })}
              placeholder={t('consumableSupplies.minimumStockPlaceholder')}
            />
          </div>

          <div>
            <label className="gd-label">
              {t('consumableSupplies.color')}
            </label>
            <select
              {...register('colorUuid')}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('consumableSupplies.selectColor')}</option>
              {colorOptions.map((c) => (
                <option key={c.uuid} value={c.uuid}>
                  {c.code}{c.name ? ` - ${c.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('consumableSupplies.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditConsumableSupplyModal;
