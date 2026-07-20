import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  AuthUser,
  CustomerCategory,
  User,
  ContactInfo,
  CreateCustomerForm,
} from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DeliveryLocationsSection from './DeliveryLocationsSection';

export interface CustomerFormProps {
  mode: 'create' | 'edit';
  currentUser: AuthUser | null;
  categories: CustomerCategory[];
  salesPersons: User[];
  form: UseFormReturn<CreateCustomerForm>;
  contacts: ContactInfo[];
  setContacts: React.Dispatch<React.SetStateAction<ContactInfo[]>>;
  /** Present in edit mode — enables the delivery-locations manager. */
  customerUuid?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  mode,
  currentUser,
  categories,
  salesPersons,
  form,
  contacts,
  setContacts,
  customerUuid,
  loading,
  error,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4 bg-secondary-50/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-secondary-900 border-b pb-2">
          {t('common:customerModal.basicInformation')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('name', {
              required: t('common:customerModal.validation.nameRequired'),
              minLength: {
                value: 2,
                message: t('common:customerModal.validation.nameMinLength'),
              },
            })}
            label={`${t('common:customerModal.customerName')} *`}
            placeholder={t('common:customerModal.enterCustomerName')}
            error={errors.name?.message as string}
          />

          <Input
            {...register('legalName')}
            label={t('common:customerModal.legalName')}
            placeholder={t('common:customerModal.enterLegalName')}
            error={errors.legalName?.message as string}
          />

          <Input
            {...register('legalCode')}
            label={t('common:customerModal.legalCode')}
            placeholder={t('common:customerModal.enterLegalCode')}
            error={errors.legalCode?.message as string}
          />

          <Input
            {...register('tradeName')}
            label={t('common:customerModal.tradeName')}
            placeholder={t('common:customerModal.enterTradeName')}
            error={errors.tradeName?.message as string}
          />

          <Input
            {...register('supplierCode')}
            label={t('common:customerModal.supplierCode')}
            placeholder={t('common:customerModal.enterSupplierCode')}
            error={errors.supplierCode?.message as string}
          />

          <Input
            {...register('code')}
            label={t('common:customerModal.code')}
            placeholder={t('common:customerModal.enterCode')}
            error={errors.code?.message as string}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('common:customerModal.address')}
          </label>
          <textarea
            {...register('address')}
            rows={5}
            placeholder={t('common:customerModal.enterAddress')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('common:customerModal.notes')}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={t('common:customerModal.enterNotes')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('active')}
              id="active"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-secondary-900">
              {t('common:customerModal.active')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('dispatchable')}
              id="dispatchable"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="dispatchable" className="ml-2 block text-sm text-secondary-900">
              {t('common:customerModal.dispatchable')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('excludeLogoOnLabels')}
              id="excludeLogoOnLabels"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="excludeLogoOnLabels" className="ml-2 block text-sm text-secondary-900">
              {t('common:customerModal.excludeLogoOnLabels')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('requiresQualityCertificate')}
              id="requiresQualityCertificate"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="requiresQualityCertificate" className="ml-2 block text-sm text-secondary-900">
              {t('common:customerModal.requiresQualityCertificate')}
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-secondary-50/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-secondary-900 border-b pb-2">
          {t('common:customerModal.assignment')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('common:customerModal.category')}
            </label>
            <select
              {...register('categoryId')}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('common:customerModal.selectCategory')}</option>
              {categories.map((category) => (
                <option key={category.uuid} value={category.uuid}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('common:customerModal.salesPerson')}
            </label>
            <select
              {...register('salesPersonId')}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('common:customerModal.selectSalesPerson')}</option>
              {salesPersons.map((person) => (
                <option key={person.uuid} value={person.uuid}>
                  {person.firstName} {person.lastName} ({person.email})
                </option>
              ))}
            </select>
            {errors.salesPersonId && (
              <p className="mt-1 text-sm text-red-600">{errors.salesPersonId.message as string}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-secondary-50/30 rounded-lg p-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-sm font-semibold text-secondary-900">
            {t('common:customerModal.contacts')}
          </h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setContacts([...contacts, { role: '', name: '', phone: '' }])}
          >
            {t('common:customerModal.addContact')}
          </Button>
        </div>

        {contacts.map((contact, index) => (
          <div key={index} className="bg-white border border-secondary-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-secondary-700">
                {t('common:customerModal.contact')} {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setContacts(contacts.filter((_, i) => i !== index))}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t('common:customerModal.remove')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder={`${t('common:customerModal.role')} *`}
                value={contact.role}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].role = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder={`${t('common:customerModal.name')} *`}
                value={contact.name}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].name = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder={`${t('common:customerModal.phone')} *`}
                value={contact.phone}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].phone = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder={t('common:customerModal.altPhone')}
                value={contact.altPhone || ''}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].altPhone = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder={t('common:customerModal.mobile')}
                value={contact.mobile || ''}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].mobile = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                placeholder={t('common:customerModal.email')}
                value={contact.email || ''}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[index].email = e.target.value;
                  setContacts(updated);
                }}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <textarea
              placeholder={t('common:customerModal.notes')}
              value={contact.notes || ''}
              onChange={(e) => {
                const updated = [...contacts];
                updated[index].notes = e.target.value;
                setContacts(updated);
              }}
              rows={2}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        ))}
      </div>

      {mode === 'edit' && customerUuid ? (
        <DeliveryLocationsSection customerUuid={customerUuid} />
      ) : (
        <div className="bg-secondary-50/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-secondary-900 border-b pb-2 mb-2">
            {t('common:customerModal.deliveryLocations')}
          </h3>
          <p className="text-sm text-secondary-500">
            {t('common:customerModal.locationsAfterSaveHint')}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {t('common:customerModal.cancel')}
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'create'
            ? t('common:customerModal.createButton')
            : t('common:customerModal.updateButton')}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
