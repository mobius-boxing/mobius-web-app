import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm, RoleProfileType } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PROFILE_TYPES: RoleProfileType[] = [
  'general',
  'director',
  'productionManager',
  'qualityManager',
  'salesperson',
];

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateRoleForm>({
    defaultValues: { profileType: 'general', hasAccessToAllMachines: true },
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => rolesApi.createRole(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roles.createTitle')}>
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
            id="create-role-machines"
            type="checkbox"
            {...register('hasAccessToAllMachines')}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="create-role-machines"
            className="text-sm text-secondary-700"
          >
            {t('roles.hasAccessToAllMachines')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('roles.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateRoleModal;
