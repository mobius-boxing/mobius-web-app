import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UpdateUserRequest } from '../../types';
import { usersApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { editUserSchema } from '../../validation/schemas/user';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUserUuid?: string;
  /** Overrides `user.avatarUuid` so a photo change shows without re-seeding the form. */
  avatarUuid?: string | null;
  onChangePhoto?: () => void;
  onSuccess: () => void;
}

/**
 * Name, email, active flag and (superAdmin) password. The role is changed from
 * the row's inline picker: `PUT /users/:uuid` ignores `role`, so the field is
 * carried only because the shared schema requires it.
 */
const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUserUuid,
  avatarUuid,
  onChangePhoto,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { isSuperAdmin, effectiveCompanyId } = useEffectiveCompany();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      reset,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<UpdateUserRequest>({ onSuccess, onClose, schema: editUserSchema(t) });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
  }, [isOpen, user, reset]);

  const onSubmit = handleSubmit((data) => {
    // A blank password would overwrite the stored one with an empty value.
    const { password, companyId: _ignored, ...rest } = data;
    const payload: UpdateUserRequest = {
      ...rest,
      ...(password ? { password } : {}),
      ...(isSuperAdmin && effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    return usersApi.updateUser(user.uuid, payload);
  });

  const canEditStatus = currentUserUuid !== user.uuid;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('userManagement.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        {onChangePhoto && (
          <div className="flex items-center gap-4">
            <UserAvatar
              user={{ ...user, avatarUuid: avatarUuid === undefined ? user.avatarUuid : avatarUuid }}
              className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center"
              textClassName="text-lg font-medium text-primary-600"
            />
            <Button type="button" variant="outline" onClick={onChangePhoto}>
              {t('avatar.changeUserPhoto')}
            </Button>
          </div>
        )}

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

        {canEditStatus && (
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-900">
              {t('userManagement.isActive')}
            </label>
          </div>
        )}

        {isSuperAdmin && (
          <Input
            {...register('password')}
            type="password"
            label={t('userManagement.newPassword')}
            placeholder={t('userManagement.newPasswordPlaceholder')}
            helperText={t('userManagement.passwordHint')}
            error={errors.password?.message as string}
          />
        )}

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('userManagement.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditUserModal;
