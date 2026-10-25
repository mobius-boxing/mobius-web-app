import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InviteCompanyUserRequest } from '../../types';
import { invitationsApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { useAssignableRoles } from '../../hooks/useAssignableRoles';
import { inviteCompanyUserSchema } from '../../validation/schemas/invitation';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';

interface InviteCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** superAdmin only: the selected company, sent in the body. */
  companyId?: string;
}

const InviteCompanyUserModal: React.FC<InviteCompanyUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyId,
}) => {
  const { t } = useTranslation();
  const { roles } = useAssignableRoles(companyId);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      setValue,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<InviteCompanyUserRequest>({
    onSuccess,
    onClose,
    schema: inviteCompanyUserSchema(t),
  });

  useEffect(() => {
    if (!isOpen || roles.length === 0) return;
    const member = roles.find((role) => role.systemKey === 'member');
    setValue('roleUuid', member?.uuid || roles[0].uuid);
  }, [isOpen, roles, setValue]);

  const onSubmit = handleSubmit((data) =>
    invitationsApi.createRoleInvitation(companyId ? { ...data, companyId } : data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('userManagement.inviteTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-5">
        <ErrorMessage message={error} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label={t('userManagement.firstName')}
            placeholder={t('userManagement.firstNamePlaceholder')}
            error={errors.firstName?.message as string}
          />
          <Input
            {...register('lastName')}
            label={t('userManagement.lastName')}
            placeholder={t('userManagement.lastNamePlaceholder')}
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label={t('userManagement.email')}
          placeholder={t('userManagement.emailPlaceholder')}
          error={errors.email?.message as string}
        />

        <div>
          <label className="gd-label" htmlFor="invite-role">{t('userManagement.role')}</label>
          <select
            id="invite-role"
            {...register('roleUuid')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {roles.map((role) => (
              <option key={role.uuid} value={role.uuid}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.roleUuid.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('userManagement.sendInvitation')}
        />
      </form>
    </Modal>
  );
};

export default InviteCompanyUserModal;
