import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Company, InviteUserRequest } from '../../types';
import { invitationsApi, companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
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
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<InviteUserRequest>({
    onSuccess,
    onClose,
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen && currentUser?.role === 'superAdmin') {
      fetchCompanies();
    }
  }, [isOpen, currentUser]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await companiesApi.getCompanies();
      setCompanies(companiesData.data);
    } catch (error) {
      logger.error('Error fetching companies:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    // Determine companyId based on role and user
    let companyId: string | undefined;

    if (data.role === 'superAdmin') {
      // SuperAdmins don't need a company
      companyId = undefined;
    } else if (currentUser?.role === 'superAdmin') {
      // SuperAdmin creating non-superAdmin user
      companyId = data.companyId;
    } else {
      // Regular admin creating user in their company
      companyId = currentUser?.companyId;
    }

    const inviteData = {
      ...data,
      companyId,
    };

    return invitationsApi.createInvitation(inviteData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User">
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

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Role
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a role</option>
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

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText="Send Invitation"
        />
      </form>
    </Modal>
  );
};

export default InviteUserModal;
