import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  actions
}) => {
  return (
    <div className={cn('card', className)}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-secondary-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;