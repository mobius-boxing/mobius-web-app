import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, TableSkeleton } from '../../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders the requested number of bars', () => {
    const { container } = render(<Skeleton lines={4} data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(container.querySelectorAll('.gd-skel')).toHaveLength(4);
  });

  it('renders five table rows', () => {
    render(<TableSkeleton data-testid="table-skeleton" />);

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('table-skeleton-row')).toHaveLength(5);
  });
});
