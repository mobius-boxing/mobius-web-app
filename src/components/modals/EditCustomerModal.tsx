import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Customer, CreateCustomerForm, CustomerCategory, User, ContactInfo, DeliveryLocation, DeliveryDay } from '../../types';
import { customersApi, customerCategoriesApi, usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import CustomerForm from '../forms/CustomerForm';

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
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [salesPersons, setSalesPersons] = useState<User[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<DeliveryDay[]>([]);

  const form = useForm<CreateCustomerForm>();

  const { handleSubmit, reset, setValue } = form;

  useEffect(() => {
    if (isOpen && customer) {
      // Set form values with current customer data
      setValue('name', customer.name);
      setValue('legalName', customer.legalName || '');
      setValue('tradeName', customer.tradeName || '');
      setValue('supplierCode', customer.supplierCode || '');
      setValue('address', customer.address || '');
      setValue('active', customer.active);
      setValue('categoryId', customer.categoryId ? String(customer.categoryId) : '');
      setValue('salesPersonId', customer.salesPersonId ? String(customer.salesPersonId) : '');

      // Initialize arrays
      setContacts(customer.contacts || []);
      setDeliveryLocations(customer.deliveryLocations || []);
      setDeliveryDays(customer.deliveryDays || []);

      // Fetch dropdown data
      fetchDropdownData();
    }
  }, [isOpen, customer, setValue]);

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
    if (!customer) return;

    setLoading(true);
    setError('');

    try {
      // Convert empty strings to undefined for optional fields
      const customerData = {
        ...data,
        categoryId: data.categoryId || undefined,
        salesPersonId: data.salesPersonId || undefined,
        supplierCode: data.supplierCode || undefined,
        legalName: data.legalName || undefined,
        tradeName: data.tradeName || undefined,
        address: data.address || undefined,
        contacts: contacts.length > 0 ? contacts : undefined,
        deliveryLocations: deliveryLocations.length > 0 ? deliveryLocations : undefined,
        deliveryDays: deliveryDays.length > 0 ? deliveryDays : undefined,
      };

      await customersApi.updateCustomer(customer.uuid, customerData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating customer:', err);
      setError(
        err.response?.data?.message ||
        t('common:customerModal.errors.updateFailed')
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

  if (!customer) return null;

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

export default EditCustomerModal;
