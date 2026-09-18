import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FilterPromptStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export const FilterPromptState: React.FC<FilterPromptStateProps> = ({
  icon: Icon,
  title,
  description,
  className = '',
}) => (
  <div className={`text-center py-12 ${className}`}>
    <Icon className="mx-auto h-12 w-12 text-secondary-400" />
    <h3 className="mt-2 text-sm font-medium text-secondary-900">{title}</h3>
    <p className="gd-page-sub">{description}</p>
  </div>
);

export default FilterPromptState;
