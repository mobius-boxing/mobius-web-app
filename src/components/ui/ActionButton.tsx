import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import Button from './Button';
import Tooltip from './Tooltip';
import { cn } from '../../utils/cn';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

/**
 * The icon-only button for a grid actions column: `Button variant="ghost"
 * size="sm"`, `aria-label` and the hover/focus tooltip from one `label`, so
 * there is exactly one source of truth for the accessible name and what a
 * sighted user sees on hover.
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  children,
  tone = 'default',
  className,
  ...props
}) => (
  <Tooltip label={label}>
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      className={cn(tone === 'danger' && 'text-red-600 hover:text-red-700', className)}
      {...props}
    >
      {children}
    </Button>
  </Tooltip>
);

export default ActionButton;
