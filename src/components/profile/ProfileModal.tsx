import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import { PASSWORD_MIN_LENGTH } from '../../validation/fields';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import UserAvatar from '../ui/UserAvatar';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import AvatarModal from './AvatarModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// API error messages are English-only, so the UI never shows them verbatim.
const apiMessageOf = (err: unknown): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setNameError(null);
    setNameSaved(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSaved(false);
    // Re-seeding on every user change would overwrite what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!user) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSaved(false);
    if (!firstName.trim() || !lastName.trim()) {
      setNameError(t('profile.nameRequired'));
      return;
    }
    setNameBusy(true);
    setNameError(null);
    try {
      const saved = await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      updateUser({ ...user, firstName: saved.firstName, lastName: saved.lastName });
      setNameSaved(true);
    } catch (err) {
      setNameError(t('profile.nameFailed'));
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(false);
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(t('profile.passwordTooShort', { min: PASSWORD_MIN_LENGTH }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    setPasswordBusy(true);
    setPasswordError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(
        /current password/i.test(apiMessageOf(err))
          ? t('profile.passwordWrongCurrent')
          : t('profile.passwordFailed')
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t('profile.title')}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              user={user}
              className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center"
              textClassName="text-lg font-medium text-primary-600"
            />
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-secondary-900 truncate">{user.email}</p>
              <Button type="button" variant="outline" onClick={() => setAvatarOpen(true)}>
                {t('avatar.changeUserPhoto')}
              </Button>
            </div>
          </div>

          <form onSubmit={saveName} className="space-y-3">
            <ErrorMessage message={nameError} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('profile.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
              />
              <Input
                label={t('profile.lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              {nameSaved && <span className="text-sm text-green-700">{t('profile.nameSaved')}</span>}
              <Button type="submit" loading={nameBusy}>
                {t('profile.saveName')}
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            <span className="gd-label">{t('profile.language')}</span>
            <LanguageSwitcher />
          </div>

          <form onSubmit={savePassword} className="space-y-3">
            <h3 className="text-sm font-semibold text-secondary-900 border-b pb-2">
              {t('profile.password')}
            </h3>
            <ErrorMessage message={passwordError} />
            <Input
              type="password"
              autoComplete="current-password"
              label={t('profile.currentPassword')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="password"
                autoComplete="new-password"
                label={t('profile.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                autoComplete="new-password"
                label={t('profile.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              {passwordSaved && (
                <span className="text-sm text-green-700">{t('profile.passwordChanged')}</span>
              )}
              <Button type="submit" loading={passwordBusy} disabled={!currentPassword || !newPassword}>
                {t('profile.password')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <AvatarModal
        isOpen={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        user={user}
        upload={authApi.uploadAvatar}
        remove={authApi.removeAvatar}
        onChanged={(avatarUuid) => updateUser({ ...user, avatarUuid })}
      />
    </>
  );
};

export default ProfileModal;
