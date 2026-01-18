import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { CreateCustomerForm, CustomerCategory, User, ContactInfo, DeliveryLocation, DeliveryDay } from '../../types';
import { customersApi, customerCategoriesApi, usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import CustomerForm from '../forms/CustomerForm';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [salesPersons, setSalesPersons] = useState<User[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<DeliveryDay[]>([]);

  const form = useForm<CreateCustomerForm>({
    defaultValues: {
      active: true,
    },
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await customerCategoriesApi.getCategories();
      setCategories(categoriesResponse.data || []);

      // Fetch users (sales persons)
      const usersResponse = await usersApi.getUsers();
      setSalesPersons(usersResponse.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const onSubmit = async (data: CreateCustomerForm) => {
    setLoading(true);
    setError('');

    try {
      // Convert empty strings to undefined for optional fields
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
        contacts: contacts.length > 0 ? contacts : undefined,
        deliveryLocations: deliveryLocations.length > 0 ? deliveryLocations : undefined,
        deliveryDays: deliveryDays.length > 0 ? deliveryDays : undefined,
      };

      await customersApi.createCustomer(customerData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(
        err.response?.data?.message ||
        t('common:customerModal.errors.createFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setContacts([]);
    setDeliveryLocations([]);
    setDeliveryDays([]);
    onClose();
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
        deliveryLocations={deliveryLocations}
        setDeliveryLocations={setDeliveryLocations}
        deliveryDays={deliveryDays}
        setDeliveryDays={setDeliveryDays}
        loading={loading}
        error={error}
        onClose={handleClose}
        onSubmit={handleSubmit(onSubmit)}
      />
    </Modal>
  );
};

export default CreateCustomerModal;
