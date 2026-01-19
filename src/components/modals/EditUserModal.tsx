import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModalForm } from '../../hooks/useModalForm';
import { User, Company, UpdateUserRequest } from '../../types';
import { usersApi, companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      watch,
      setValue,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<UpdateUserRequest>({
    onSuccess: () => {
      // The actual onSuccess with updatedUser is called in onSubmit
    },
    onClose,
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      // Set form values with current user data
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('isActive', user.isActive);

      // Fetch companies if superAdmin
      if (currentUser?.role === 'superAdmin') {
        fetchCompanies();
      }
    }
  }, [isOpen, user, setValue, currentUser]);

  // Set company value after companies are loaded
  useEffect(() => {
    if (isOpen && companies.length > 0 && user.companyId) {
      // Find the company matching the user's companyId (numeric ID)
      // Company.id is the numeric ID as string, user.companyId might be number or string
      const userCompany = companies.find(c => String(c.id) === String(user.companyId));
      if (userCompany) {
        setValue('companyId', userCompany.uuid);
      }
    }
  }, [isOpen, companies, user.companyId, setValue]);

  const fetchCompanies = async () => {
    try {
      const companiesResponse = await companiesApi.getCompanies();
      setCompanies(companiesResponse.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    // For non-superAdmin users, preserve the company
    const updateData: UpdateUserRequest = {
      ...data,
      companyId: currentUser?.role === 'superAdmin' ? data.companyId : user.companyId,
    };

    // Only include password if it's not empty
    if (!updateData.password) {
      delete updateData.password;
    }

    const updatedUser = await usersApi.updateUser(user.uuid, updateData);
    onSuccess(updatedUser);
  });

  // Check if current user can edit this user
  const canEditRole = () => {
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin') return true;
    return false;
  };

  const canEditStatus = () => {
    if (currentUser?.uuid === user.uuid) return false; // Can't deactivate self
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin') return true;
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit User">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters',
              },
            })}
            label="First Name"
            placeholder="Enter first name"
            error={errors.firstName?.message as string}
          />

          <Input
            {...register('lastName', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters',
              },
            })}
            label="Last Name"
            placeholder="Enter last name"
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
          type="email"
          label="Email Address"
          placeholder="Enter email address"
          error={errors.email?.message as string}
        />

        {canEditRole() && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Role
            </label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              {currentUser?.role === 'superAdmin' && (
                <option value="superAdmin">Super Admin</option>
              )}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
            )}
          </div>
        )}

        {currentUser?.role === 'superAdmin' && selectedRole !== 'superAdmin' && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Company
            </label>
            <select
              {...register('companyId', { required: 'Company is required' })}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600">{errors.companyId.message as string}</p>
            )}
          </div>
        )}

        {selectedRole === 'superAdmin' && currentUser?.role === 'superAdmin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Super Admins have platform-wide access and are not associated with any specific company.
            </p>
          </div>
        )}

        {canEditStatus() && (
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-900">
              User is active
            </label>
          </div>
        )}

        {currentUser?.role === 'superAdmin' && (
          <div>
            <Input
              {...register('password', {
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              type="password"
              label="New Password"
              placeholder="Leave empty to keep current password"
              error={errors.password?.message as string}
            />
            <p className="mt-1 text-xs text-secondary-500">
              Only fill this if you want to change the user's password.
            </p>
          </div>
        )}

        <ModalFooter loading={loading} onCancel={handleClose} submitText="Update User" />
      </form>
    </Modal>
  );
};

export default EditUserModal;
