import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, User } from '../../types';
import { rolesApi } from '../../services/api';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';

interface UserRolePickerProps {
  user: User;
  /** The roles the actor may assign, loaded once by the page. */
  roles: Role[];
  disabled?: boolean;
  onAssigned: () => void;
  onError: (message: string) => void;
}

/** Inline role picker for a Users row; only a superAdmin names the company. */
const UserRolePicker: React.FC<UserRolePickerProps> = ({ user, roles, disabled, onAssigned, onError }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [saving, setSaving] = useState(false);

  if (disabled || roles.length === 0) {
    return <span className="text-sm text-secondary-700">{user.roleName || '-'}</span>;
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleUuid = e.target.value;
    if (!roleUuid || roleUuid === user.roleUuid) return;
    setSaving(true);
    try {
      await rolesApi.assignRole(user.uuid, roleUuid, effectiveCompanyId);
      onAssigned();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(message || t('userManagement.assignRoleFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={user.roleUuid || ''}
      onChange={handleChange}
      disabled={saving}
      aria-label={t('userManagement.role')}
      className="border border-secondary-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
    >
      {!user.roleUuid && <option value="">{user.roleName || '-'}</option>}
      {/* A role above the actor's ceiling is not assignable but must still show, or the
          browser selects the first option and one stray change reassigns the user. */}
      {user.roleUuid && !roles.some((role) => role.uuid === user.roleUuid) && (
        <option value={user.roleUuid} disabled>
          {user.roleName || '-'}
        </option>
      )}
      {roles.map((role) => (
        <option key={role.uuid} value={role.uuid}>
          {role.name}
        </option>
      ))}
    </select>
  );
};

export default UserRolePicker;
