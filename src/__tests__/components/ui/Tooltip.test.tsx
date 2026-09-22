import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Tooltip from '../../../components/ui/Tooltip';

describe('Tooltip', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the tooltip after a 150ms hover and hides it on mouse leave', () => {
    jest.useFakeTimers();
    render(
      <Tooltip label="Editar">
        <button>trigger</button>
      </Tooltip>
    );

    const wrapper = screen.getByRole('button').parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);

    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Editar');

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows the tooltip immediately on focus and hides it on blur', () => {
    render(
      <Tooltip label="Eliminar">
        <button>trigger</button>
      </Tooltip>
    );

    const button = screen.getByRole('button');
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Eliminar');

    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('hides on Escape', () => {
    render(
      <Tooltip label="Eliminar">
        <button>trigger</button>
      </Tooltip>
    );

    fireEvent.focus(screen.getByRole('button'));
    expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('still shows on hover when the trigger button is disabled', () => {
    jest.useFakeTimers();
    render(
      <Tooltip label="Eliminar">
        <button disabled>trigger</button>
      </Tooltip>
    );

    const wrapper = screen.getByRole('button').parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Eliminar');
  });

  it('renders the tooltip node with role=tooltip and aria-hidden', () => {
    render(
      <Tooltip label="Editar">
        <button>trigger</button>
      </Tooltip>
    );

    fireEvent.focus(screen.getByRole('button'));
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(tip).toHaveAttribute('aria-hidden', 'true');
  });
});
