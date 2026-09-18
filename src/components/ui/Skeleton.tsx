import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  lines?: number;
  className?: string;
  'data-testid'?: string;
}

export function Skeleton({
  lines = 3,
  className,
  'data-testid': testId,
}: SkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)} data-testid={testId}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={cn('gd-skel h-4 w-full', index === lines - 1 && 'w-2/3')}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ className, 'data-testid': testId }: Omit<SkeletonProps, 'lines'>) {
  return (
    <div className={cn('card', className)} data-testid={testId}>
      <div className="animate-pulse">
        <div className="gd-skel mb-4 h-4 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="gd-skel h-4 w-full" data-testid="table-skeleton-row" />
          ))}
        </div>
      </div>
    </div>
  );
}
