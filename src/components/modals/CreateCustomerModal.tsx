import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createCustomerSchema } from '../../validation/schemas/customer';
import { CreateCustomerForm, CustomerCategory, User, ContactInfo } from '../../types';
import { customersApi, customerCategoriesApi, usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import CustomerForm from '../forms/CustomerForm';
import { logger } from '../../utils/logger';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [salesPersons, setSalesPersons] = useState<User[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);

  const {
    form,
    loading,
    error,
    handleSubmit,
    handleClose: modalHandleClose,
  } = useModalForm<CreateCustomerForm>({
    defaultValues: {
      active: true,
      dispatchable: true,
    },
    onSuccess,
    onClose,
    schema: createCustomerSchema(t),
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, effectiveCompanyId]);

  const fetchDropdownData = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const categoriesResponse = await customerCategoriesApi.getCategories({ limit: 100, ...companyFilter });
      setCategories(categoriesResponse.data || []);

      const usersResponse = await usersApi.getUsers({ limit: 100, ...companyFilter });
      setSalesPersons(usersResponse.data || []);
    } catch (error) {
      logger.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const customerData = {
      ...data,
      companyId: effectiveCompanyId,
      categoryId: data.categoryId || undefined,
      salesPersonId: data.salesPersonId || undefined,
      supplierCode: data.supplierCode || undefined,
      legalName: data.legalName || undefined,
      legalCode: data.legalCode || undefined,
      tradeName: data.tradeName || undefined,
      address: data.address || undefined,
      code: data.code || undefined,
      notes: data.notes || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
    };
    return customersApi.createCustomer(customerData);
  });

  const handleClose = () => {
    setContacts([]);
    modalHandleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('common:customerModal.createTitle')} size="xl">
      <CustomerForm
        mode="create"
        currentUser={currentUser}
        categories={categories}
        salesPersons={salesPersons}
        form={form}
        contacts={contacts}
        setContacts={setContacts}
        loading={loading}
        error={error}
        onClose={handleClose}
        onSubmit={form.handleSubmit(onSubmit)}
      />
    </Modal>
  );
};

export default CreateCustomerModal;
