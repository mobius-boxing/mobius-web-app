import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createRoleSchema } from '../../validation/schemas/role';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** superAdmin only: the company the new role belongs to. */
  companyId?: string;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onSuccess, companyId }) => {
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
    defaultValues: { name: '' },
    onSuccess,
    onClose,
    schema: createRoleSchema(t),
  });

  const onSubmit = handleSubmit((data) => rolesApi.createRole({ ...data, companyId }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roleManagement.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('name')}
          label={t('roleManagement.name')}
          placeholder={t('roleManagement.namePlaceholder')}
          error={errors.name?.message as string}
          required
        />

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('roleManagement.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateRoleModal;
