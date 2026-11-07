import React from 'react';
import Avatar from './Avatar';
import { customerAvatarSrc } from './UserAvatar';

interface CustomerAvatarProps {
  customer: { avatarUuid?: string | null; name?: string } | null | undefined;
  className: string;
  textClassName?: string;
}

export const customerInitials = (name?: string): string =>
  (name ?? '').trim().slice(0, 2).toUpperCase();

const CustomerAvatar: React.FC<CustomerAvatarProps> = ({ customer, className, textClassName }) => (
  <Avatar
    src={customer?.avatarUuid ? customerAvatarSrc(customer.avatarUuid) : null}
    initials={customerInitials(customer?.name)}
    className={className}
    textClassName={textClassName}
  />
);

export default CustomerAvatar;
