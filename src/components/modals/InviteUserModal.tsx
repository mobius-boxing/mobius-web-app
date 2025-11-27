import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
// import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Company, InviteUserRequest } from '../../types';
import { invitationsApi, companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InviteUserRequest>();

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
      console.error('Error fetching companies:', error);
    }
  };

  const onSubmit = async (data: InviteUserRequest) => {
    setLoading(true);
    setError('');

    try {
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

      await invitationsApi.createInvitation(inviteData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setError(
        err.response?.data?.message ||
        'Failed to send invitation. Please try again.'
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

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
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteUserModal;