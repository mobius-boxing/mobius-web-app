import React from 'react';
import { isLiteBuild } from '../../utils/product';

const LiteBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  if (!isLiteBuild()) return null;
  return (
    <span
      className={`rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 ${className}`}
    >
      Lite
    </span>
  );
};

export default LiteBadge;
