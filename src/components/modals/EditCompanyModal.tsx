import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Company, CreateCompanyForm } from '../../types';
import { companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSuccess: () => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCompanyForm>();

  useEffect(() => {
    if (isOpen && company) {
      // Set form values with current company data
      setValue('name', company.name);
      setValue('description', company.description || '');
    }
  }, [isOpen, company, setValue]);

  const onSubmit = async (data: CreateCompanyForm) => {
    if (!company) return;

    setLoading(true);
    setError('');

    try {
      await companiesApi.updateCompany(company.id, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating company:', err);
      setError(
        err.response?.data?.message ||
        'Failed to update company. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  if (!company) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Company">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name', {
            required: 'Company name is required',
            minLength: {
              value: 2,
              message: 'Company name must be at least 2 characters',
            },
            maxLength: {
              value: 100,
              message: 'Company name must be less than 100 characters',
            },
          })}
          label="Company Name"
          placeholder="Enter company name"
          error={errors.name?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Description must be less than 500 characters',
              },
            })}
            rows={3}
            placeholder="Enter company description..."
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update Company
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCompanyModal;