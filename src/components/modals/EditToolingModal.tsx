import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooling, CreateToolingForm, ToolingType, Manufacturer, Supplier } from '../../types';
import { toolingsApi, toolingTypesApi, manufacturersApi, suppliersApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditToolingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tooling: Tooling | null;
  onSuccess: () => void;
}

const EditToolingModal: React.FC<EditToolingModalProps> = ({
  isOpen,
  onClose,
  tooling,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [toolingTypes, setToolingTypes] = useState<ToolingType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  } = useModalForm<CreateToolingForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && tooling) {
      setDropdownsLoaded(false);
      fetchDropdownData();
    }
  }, [isOpen, tooling]);

  useEffect(() => {
    if (isOpen && tooling && dropdownsLoaded) {
      reset({
        name: tooling.name,
        description: tooling.description || '',
        toolingTypeUuid: tooling.toolingType?.uuid || '',
        manufacturerUuid: tooling.manufacturer?.uuid || '',
        supplierUuid: tooling.supplier?.uuid || '',
        minimumStock: tooling.minimumStock || 0,
      });
    }
  }, [isOpen, tooling, dropdownsLoaded, reset]);

  const fetchDropdownData = async () => {
    try {
      const [toolingTypesRes, manufacturersRes, suppliersRes] = await Promise.all([
        toolingTypesApi.getToolingTypes({ limit: 100, companyId: effectiveCompanyId || undefined }),
        manufacturersApi.getManufacturers({ limit: 100, companyId: effectiveCompanyId || undefined }),
        suppliersApi.getSuppliers({ limit: 100, companyId: effectiveCompanyId || undefined }),
      ]);
      setToolingTypes(toolingTypesRes.data || []);
      setManufacturers(manufacturersRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  if (!tooling) return null;

  const onSubmit = handleSubmit((data) =>
    toolingsApi.updateTooling(tooling.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolings.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('name', {
            required: t('toolings.validation.nameRequired'),
            minLength: {
              value: 1,
              message: t('toolings.validation.nameMinLength'),
            },
            maxLength: {
              value: 255,
              message: t('toolings.validation.nameMaxLength'),
            },
          })}
          label={t('toolings.name')}
          placeholder={t('toolings.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('toolings.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.toolingType')} *
          </label>
          <select
            {...register('toolingTypeUuid', {
              required: t('toolings.validation.toolingTypeRequired'),
            })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectToolingType')}</option>
            {toolingTypes.map((tt) => (
              <option key={tt.uuid} value={tt.uuid}>
                {tt.code} - {tt.name}
              </option>
            ))}
          </select>
          {errors.toolingTypeUuid && (
            <p className="text-sm text-red-600 mt-1">{errors.toolingTypeUuid.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.manufacturer')}
          </label>
          <select
            {...register('manufacturerUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectManufacturer')}</option>
            {manufacturers.map((m) => (
              <option key={m.uuid} value={m.uuid}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolings.supplier')}
          </label>
          <select
            {...register('supplierUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('toolings.selectSupplier')}</option>
            {suppliers.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.code}
              </option>
            ))}
          </select>
        </div>

        <Input
          {...register('minimumStock', {
            valueAsNumber: true,
            min: {
              value: 0,
              message: t('toolings.validation.minimumStockMin'),
            },
          })}
          type="number"
          label={t('toolings.minimumStock')}
          placeholder="0"
          error={errors.minimumStock?.message as string}
        />

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('toolings.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditToolingModal;
