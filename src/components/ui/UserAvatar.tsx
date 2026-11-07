import React from 'react';
import Avatar from './Avatar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const avatarSrc = (avatarUuid: string): string =>
  `${API_BASE_URL}/api/public/avatars/${avatarUuid}`;

export const customerAvatarSrc = (avatarUuid: string): string =>
  `${API_BASE_URL}/api/public/customer-avatars/${avatarUuid}`;

interface UserAvatarProps {
  user: { avatarUuid?: string | null; firstName?: string; lastName?: string } | null | undefined;
  /** Sizing/colour of the circle; the photo fills it. */
  className: string;
  textClassName?: string;
}

/** Photo when the user has one and it loads; otherwise the initials. */
const UserAvatar: React.FC<UserAvatarProps> = ({ user, className, textClassName }) => (
  <Avatar
    src={user?.avatarUuid ? avatarSrc(user.avatarUuid) : null}
    initials={`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`}
    className={className}
    textClassName={textClassName}
  />
);

export default UserAvatar;
