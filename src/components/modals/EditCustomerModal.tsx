import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Customer, CreateCustomerForm, CustomerCategory, User, ContactInfo } from '../../types';
import { customersApi, customerCategoriesApi, usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import CustomerForm from '../forms/CustomerForm';
import { useModalForm } from '../../hooks/useModalForm';
import { editCustomerSchema } from '../../validation/schemas/customer';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { effectiveCompanyId } = useEffectiveCompany();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [salesPersons, setSalesPersons] = useState<User[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const {
    form,
    loading,
    error,
    handleSubmit,
    handleClose: baseHandleClose,
  } = useModalForm<CreateCustomerForm>({
    onSuccess,
    onClose,
    schema: editCustomerSchema(t),
  });

  const { handleSubmit: formSubmit, reset } = form;

  useEffect(() => {
    if (isOpen && customer) {
      setDropdownsLoaded(false);
      fetchDropdownData();
    }
  }, [isOpen, customer]);

  useEffect(() => {
    if (isOpen && customer && dropdownsLoaded) {
      reset({
        name: customer.name,
        legalName: customer.legalName || '',
        legalCode: customer.legalCode || '',
        tradeName: customer.tradeName || '',
        supplierCode: customer.supplierCode || '',
        code: customer.code || '',
        address: customer.address || '',
        notes: customer.notes || '',
        active: customer.active,
        dispatchable: customer.dispatchable ?? true,
        excludeLogoOnLabels: customer.excludeLogoOnLabels ?? false,
        requiresQualityCertificate: customer.requiresQualityCertificate ?? false,
        categoryId: customer.category?.uuid || '',
        salesPersonId: customer.salesPerson?.uuid || '',
      });

      setContacts(customer.contacts || []);
    }
  }, [isOpen, customer, dropdownsLoaded, reset]);

  const fetchDropdownData = async () => {
    try {
      const [categoriesResponse, usersResponse] = await Promise.all([
        customerCategoriesApi.getCategories({ ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }),
        usersApi.getUsers({ ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }),
      ]);
      setCategories(categoriesResponse.data || []);
      setSalesPersons(usersResponse.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  const handleClose = () => {
    setContacts([]);
    baseHandleClose();
  };

  if (!customer) return null;

  const onSubmit = handleSubmit(async (data) => {
    const customerData = {
      ...data,
      categoryId: data.categoryId || undefined,
      salesPersonId: data.salesPersonId || undefined,
      supplierCode: data.supplierCode || undefined,
      legalName: data.legalName || undefined,
      legalCode: data.legalCode || undefined,
      tradeName: data.tradeName || undefined,
      code: data.code || undefined,
      notes: data.notes || undefined,
      address: data.address || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
    };

    await customersApi.updateCustomer(customer.uuid, customerData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('common:customerModal.editTitle')} size="xl">
      <CustomerForm
        mode="edit"
        currentUser={currentUser}
        categories={categories}
        salesPersons={salesPersons}
        form={form}
        contacts={contacts}
        setContacts={setContacts}
        customerUuid={customer.uuid}
        loading={loading}
        error={error}
        onClose={handleClose}
        onSubmit={formSubmit(onSubmit)}
      />
    </Modal>
  );
};

export default EditCustomerModal;
