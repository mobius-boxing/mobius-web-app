import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Edit } from 'lucide-react';
import ActionButton from '../../../components/ui/ActionButton';

describe('ActionButton', () => {
  it('exposes the label as the accessible name', () => {
    render(
      <ActionButton label="Editar" onClick={jest.fn()}>
        <Edit className="h-4 w-4" />
      </ActionButton>
    );

    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('shows the same text in the tooltip on focus, hidden from the accessibility tree', () => {
    render(
      <ActionButton label="Editar" onClick={jest.fn()}>
        <Edit className="h-4 w-4" />
      </ActionButton>
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Editar' }));
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveTextContent('Editar');
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the danger tone classes', () => {
    render(
      <ActionButton label="Eliminar" tone="danger" onClick={jest.fn()}>
        <Edit className="h-4 w-4" />
      </ActionButton>
    );

    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveClass(
      'text-red-600',
      'hover:text-red-700'
    );
  });

  it('fires onClick', () => {
    const onClick = jest.fn();
    render(
      <ActionButton label="Editar" onClick={onClick}>
        <Edit className="h-4 w-4" />
      </ActionButton>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
