import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Company, InviteUserRequest } from '../../types';
import { invitationsApi, companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { inviteUserSchema } from '../../validation/schemas/invitation';
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
  const { t } = useTranslation();
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
    schema: inviteUserSchema(t),
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
    let companyId: string | undefined;

    if (data.role === 'superAdmin') {
      companyId = undefined;
    } else if (currentUser?.role === 'superAdmin') {
      companyId = data.companyId;
    } else {
      companyId = currentUser?.companyId;
    }

    const inviteData = {
      ...data,
      companyId,
    };

    return invitationsApi.createInvitation(inviteData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('userModal.inviteTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label={t('userModal.firstName')}
            placeholder={t('userModal.firstNamePlaceholder')}
            error={errors.firstName?.message as string}
          />

          <Input
            {...register('lastName')}
            label={t('userModal.lastName')}
            placeholder={t('userModal.lastNamePlaceholder')}
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label={t('userModal.email')}
          placeholder={t('userModal.emailPlaceholder')}
          error={errors.email?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('userModal.role')}
          </label>
          <select
            {...register('role')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('userModal.selectRole')}</option>
            <option value="member">{t('roleNames.member')}</option>
            <option value="admin">{t('roleNames.admin')}</option>
            {currentUser?.role === 'superAdmin' && (
              <option value="superAdmin">{t('roleNames.superAdmin')}</option>
            )}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
          )}
        </div>

        {currentUser?.role === 'superAdmin' && selectedRole !== 'superAdmin' && (
          <div>
            <label className="gd-label">
              {t('userModal.company')}
            </label>
            <select
              {...register('companyId')}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('userModal.selectCompany')}</option>
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
          <div className="gd-alert gd-alert-info">
            <p className="text-sm text-blue-800">
              <strong>{t('userModal.noteLabel')}</strong> {t('userModal.superAdminNote')}
            </p>
          </div>
        )}

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('userModal.sendInvitation')}
        />
      </form>
    </Modal>
  );
};

export default InviteUserModal;
