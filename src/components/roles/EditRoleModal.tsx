import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm, Role } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { renameRoleSchema } from '../../validation/schemas/role';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import Button from '../ui/Button';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
  /** superAdmin only: the company the role belongs to. */
  companyId?: string;
}

/**
 * Rename only. A `systemKey` (Admin, Member) blocks rename, so the input is
 * disabled rather than letting a doomed PUT reach the server (409
 * SYSTEM_ROLE stays the source of truth).
 */
const EditRoleModal: React.FC<EditRoleModalProps> = ({ isOpen, onClose, onSuccess, role, companyId }) => {
  const { t } = useTranslation();
  const locked = !!role?.systemKey;

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
    defaultValues: { name: '' },
    onSuccess,
    onClose,
    schema: renameRoleSchema(t),
  });

  useEffect(() => {
    if (role) reset({ name: role.name });
  }, [role, reset]);

  const onSubmit = handleSubmit((data) => {
    if (!role) return Promise.reject(new Error('No role selected'));
    return rolesApi.renameRole(role.uuid, data.name, companyId);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roleManagement.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        {locked && (
          <div className="gd-alert gd-alert-info">
            <p className="text-sm text-blue-800">{t('roleManagement.systemRoleLocked')}</p>
          </div>
        )}

        <Input
          {...register('name')}
          label={t('roleManagement.name')}
          placeholder={t('roleManagement.namePlaceholder')}
          error={errors.name?.message as string}
          disabled={locked}
          required
        />

        {locked ? (
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
          </div>
        ) : (
          <ModalFooter
            loading={loading}
            onCancel={handleClose}
            submitText={t('roleManagement.updateButton')}
          />
        )}
      </form>
    </Modal>
  );
};

export default EditRoleModal;
