import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterBar } from '../../../../components/ui/filters/FilterBar';
import { FilterDef } from '../../../../components/ui/filters/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FilterBar', () => {
  it('renders a text filter and reports plain onChange', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [{ kind: 'text', key: 'search', label: '', placeholder: 'Search…' }];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'acme' } });
    expect(onChange).toHaveBeenCalledWith('search', 'acme');
  });

  it('renders a select filter and reports the chosen value', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [
      {
        kind: 'select',
        key: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'active' } });
    expect(onChange).toHaveBeenCalledWith('status', 'active');
  });

  it('renders an entity filter through EntityAutocomplete', async () => {
    const onChange = jest.fn();
    const loadOptions = jest.fn().mockResolvedValue([{ value: 'cust-1', label: 'Acme' }]);
    const defs: FilterDef[] = [
      { kind: 'entity', key: 'customerUuid', label: 'Customer', required: true, loadOptions },
    ];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => expect(loadOptions).toHaveBeenCalled());
  });

  it('shows a required marker and disables non-required controls until the required filter has a value', () => {
    const onChange = jest.fn();
    const loadOptions = jest.fn().mockResolvedValue([]);
    const defs: FilterDef[] = [
      { kind: 'text', key: 'search', label: 'Search', placeholder: 'Search…' },
      { kind: 'entity', key: 'customerUuid', label: 'Customer', required: true, loadOptions },
    ];
    const { rerender } = render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search…')).toBeDisabled();
    expect(screen.getByRole('combobox')).not.toBeDisabled();

    rerender(
      <FilterBar
        defs={defs}
        values={{ customerUuid: { value: 'cust-1', label: 'Acme' } }}
        onChange={onChange}
      />
    );
    expect(screen.getByPlaceholderText('Search…')).not.toBeDisabled();
  });

  it('renders a date filter as a bare-day input', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [{ kind: 'date', key: 'from', label: 'From', testId: 'filter-from' }];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    const input = screen.getByTestId('filter-from');
    expect(input).toHaveAttribute('type', 'date');
    fireEvent.change(input, { target: { value: '2026-09-03' } });
    expect(onChange).toHaveBeenCalledWith('from', '2026-09-03');
  });

  it('debounces a text filter with debounceMs instead of firing per keystroke', async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const defs: FilterDef[] = [
      { kind: 'text', key: 'username', label: 'User', placeholder: 'User…', debounceMs: 300, testId: 'filter-username' },
    ];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    const input = screen.getByTestId('filter-username');
    fireEvent.change(input, { target: { value: 'mnovoa' } });
    expect(onChange).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('username', 'mnovoa');
    jest.useRealTimers();
  });
});
