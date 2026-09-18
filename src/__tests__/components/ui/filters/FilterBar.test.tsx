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

  it('renders a number filter as <input type="number">, with the shared control classes', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [
      { kind: 'number', key: 'revisionFrom', label: 'Revision from', testId: 'filter-revision-from' },
    ];
    render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

    const input = screen.getByTestId('filter-revision-from');
    expect(input).toHaveAttribute('type', 'number');
    expect(input.className).toContain('border-secondary-300');
    fireEvent.change(input, { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith('revisionFrom', '3');
  });

  describe('advanced panel (AC-2, I-4)', () => {
    const advancedDefs: FilterDef[] = [
      { kind: 'text', key: 'code', label: 'Code', advanced: true, testId: 'filter-code' },
      { kind: 'text', key: 'description', label: 'Description', advanced: true, testId: 'filter-description' },
    ];

    it('is collapsed by default, with a toggle and no badge when nothing is set', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={advancedDefs} values={{}} onChange={onChange} />);

      expect(screen.getByRole('button', { name: /filters\.advanced/ })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(screen.queryByTestId('filter-code')).not.toBeInTheDocument();
    });

    it('opens on click and shows a badge counting only advanced defs with a value', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={advancedDefs} values={{}} onChange={onChange} />);

      const toggle = screen.getByRole('button', { name: /filters\.advanced/ });
      expect(toggle).not.toHaveTextContent(/\d/); // no value set yet: no badge

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('filter-code')).toBeInTheDocument();
    });

    it('shows a badge counting only advanced defs with a value', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={advancedDefs} values={{ code: 'ABC' }} onChange={onChange} />);

      expect(screen.getByRole('button', { name: /filters\.advanced/ })).toHaveTextContent('1');
    });

    it('opens automatically when an advanced filter already has a value', () => {
      const onChange = jest.fn();
      const { rerender } = render(<FilterBar defs={advancedDefs} values={{}} onChange={onChange} />);
      expect(screen.queryByTestId('filter-code')).not.toBeInTheDocument();

      rerender(<FilterBar defs={advancedDefs} values={{ code: 'ABC' }} onChange={onChange} />);
      expect(screen.getByTestId('filter-code')).toBeInTheDocument();
    });

    it('"Limpiar" clears only advanced values, leaving primary values untouched', () => {
      const onChange = jest.fn();
      const defs: FilterDef[] = [
        { kind: 'text', key: 'search', label: '', placeholder: 'Search…' },
        ...advancedDefs,
      ];
      render(
        <FilterBar
          defs={defs}
          values={{ search: 'acme', code: 'ABC', description: 'desc' }}
          onChange={onChange}
        />
      );

      // Panel opens automatically (I-4) since code/description already have
      // values — no need to click the toggle first.
      fireEvent.click(screen.getByText('filters.clear'));

      expect(onChange).toHaveBeenCalledWith('code', undefined);
      expect(onChange).toHaveBeenCalledWith('description', undefined);
      expect(onChange).not.toHaveBeenCalledWith('search', undefined);
    });

    it('disables the toggle while a required primary filter is unmet, like any other optional control', () => {
      const onChange = jest.fn();
      const defs: FilterDef[] = [
        { kind: 'entity', key: 'customerUuid', label: 'Customer', required: true, loadOptions: jest.fn() },
        ...advancedDefs,
      ];
      render(<FilterBar defs={defs} values={{}} onChange={onChange} />);

      expect(screen.getByRole('button', { name: /filters\.advanced/ })).toBeDisabled();
    });

    it('shows the "filters.advanced" caption and the clear button together in the panel header', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={advancedDefs} values={{ code: 'ABC' }} onChange={onChange} />);

      // Panel opens automatically (I-4) since `code` already has a value.
      expect(screen.getByText('filters.advanced', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText('filters.clear')).toBeInTheDocument();
    });
  });

  describe('range pairs (AC-3)', () => {
    const rangeDefs: FilterDef[] = [
      {
        kind: 'number',
        key: 'quantityFrom',
        label: 'Quantity · from',
        advanced: true,
        testId: 'filter-quantity-from',
        range: { group: 'quantity', role: 'from', label: 'Quantity' },
      },
      {
        kind: 'number',
        key: 'quantityTo',
        label: 'Quantity · to',
        advanced: true,
        testId: 'filter-quantity-to',
        range: { group: 'quantity', role: 'to', label: 'Quantity' },
      },
    ];

    it('renders a from/to pair in one cell, under the shared group label', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={rangeDefs} values={{}} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /filters\.advanced/ }));

      // One group caption, not two per-def labels.
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.queryByText('Quantity · from')).not.toBeInTheDocument();

      const from = screen.getByTestId('filter-quantity-from');
      const to = screen.getByTestId('filter-quantity-to');
      expect(from).toHaveAttribute('aria-label', 'Quantity · from');
      expect(to).toHaveAttribute('aria-label', 'Quantity · to');
      // Both halves share the group's cell.
      expect(from.closest('div.grid')).toBe(to.closest('div.grid'));

      fireEvent.change(from, { target: { value: '10' } });
      expect(onChange).toHaveBeenCalledWith('quantityFrom', '10');
    });

    it('placeholders a number range half with filters.range.from/to', () => {
      const onChange = jest.fn();
      render(<FilterBar defs={rangeDefs} values={{}} onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /filters\.advanced/ }));

      expect(screen.getByTestId('filter-quantity-from')).toHaveAttribute('placeholder', 'filters.range.from');
      expect(screen.getByTestId('filter-quantity-to')).toHaveAttribute('placeholder', 'filters.range.to');
    });
  });

  it('renders the `children` slot between the primary row and the advanced panel', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [
      { kind: 'text', key: 'search', label: '', placeholder: 'Search…' },
      { kind: 'text', key: 'code', label: 'Code', advanced: true, testId: 'filter-code' },
    ];
    const { container } = render(
      <FilterBar defs={defs} values={{}} onChange={onChange}>
        <div data-testid="bespoke-row">Bespoke row</div>
      </FilterBar>,
    );

    fireEvent.click(screen.getByRole('button', { name: /filters\.advanced/ }));

    const root = container.firstElementChild as HTMLElement;
    const children = Array.from(root.children);
    const rowIndex = children.findIndex((el) => el.querySelector('[placeholder="Search…"]'));
    const bespokeIndex = children.findIndex((el) => el === screen.getByTestId('bespoke-row'));
    const panelIndex = children.findIndex((el) => el.querySelector('[data-testid="filter-code"]'));

    expect(rowIndex).toBeGreaterThanOrEqual(0);
    expect(bespokeIndex).toBeGreaterThan(rowIndex);
    expect(panelIndex).toBeGreaterThan(bespokeIndex);
  });

  it('never renders a grid on its own root, regardless of the caller className', () => {
    const onChange = jest.fn();
    const defs: FilterDef[] = [{ kind: 'text', key: 'search', label: '', placeholder: 'Search…' }];
    const { container } = render(<FilterBar defs={defs} values={{}} onChange={onChange} className="extra-class" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toMatch(/\bgrid\b/);
    expect(root.className).toContain('flex');
    expect(root.className).toContain('extra-class');
  });
});
