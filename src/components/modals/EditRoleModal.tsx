import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm, Role } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { PROFILE_TYPES } from './CreateRoleModal';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
}) => {
  const { t } = useTranslation();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      reset,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateRoleForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        profileType: role.profileType,
        hasAccessToAllMachines: role.hasAccessToAllMachines,
      });
    }
  }, [role, reset]);

  const onSubmit = handleSubmit((data) => {
    if (!role) return Promise.reject(new Error('No role selected'));
    return rolesApi.updateRole(role.uuid, data);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roles.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('roles.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('roles.validation.nameRequired'),
            })}
            placeholder={t('roles.namePlaceholder')}
            error={errors.name?.message}
            disabled={role?.isProtected}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('roles.profileType')}
          </label>
          <select
            {...register('profileType')}
            className="block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {PROFILE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`roles.profileTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="edit-role-machines"
            type="checkbox"
            {...register('hasAccessToAllMachines')}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="edit-role-machines"
            className="text-sm text-secondary-700"
          >
            {t('roles.hasAccessToAllMachines')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('roles.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditRoleModal;
