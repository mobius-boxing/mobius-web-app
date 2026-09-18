import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { EntityAutocomplete } from '../../../../components/ui/filters/EntityAutocomplete';
import { FilterOption } from '../../../../components/ui/filters/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function Harness({ loadOptions }: { loadOptions: (search: string) => Promise<FilterOption[]> }) {
  const [value, setValue] = React.useState<FilterOption | undefined>(undefined);
  return <EntityAutocomplete value={value} onChange={setValue} loadOptions={loadOptions} />;
}

describe('EntityAutocomplete', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads the first page on focus with empty text (minChars 0)', async () => {
    const loadOptions = jest.fn().mockResolvedValue([{ value: 'cust-1', label: 'Acme' }]);
    render(<Harness loadOptions={loadOptions} />);

    fireEvent.focus(screen.getByRole('combobox'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(loadOptions).toHaveBeenCalledWith('');
  });

  it('debounces typed search 300ms and ignores a stale response', async () => {
    let resolveFirst: (options: FilterOption[]) => void = () => {};
    const firstPromise = new Promise<FilterOption[]>((resolve) => {
      resolveFirst = resolve;
    });
    const loadOptions = jest
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => Promise.resolve([{ value: 'cust-2', label: 'Beta' }]));

    render(<Harness loadOptions={loadOptions} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(input, { target: { value: 'Ac' } });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(loadOptions).toHaveBeenCalledTimes(1); // only the focus load so far

    act(() => {
      jest.advanceTimersByTime(1);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(loadOptions).toHaveBeenCalledWith('Ac');

    // The focus-triggered request (for '') resolves after the debounced one; it must not clobber it.
    await act(async () => {
      resolveFirst([{ value: 'stale', label: 'Stale' }]);
      await Promise.resolve();
    });
    expect(screen.queryByText('Stale')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('selects an option with the keyboard and closes on Escape', async () => {
    const loadOptions = jest.fn().mockResolvedValue([
      { value: 'cust-1', label: 'Acme' },
      { value: 'cust-2', label: 'Beta' },
    ]);
    render(<Harness loadOptions={loadOptions} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue('Beta');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.focus(input);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a clear button once a value is selected, and clearing empties the input with no lookup', async () => {
    const loadOptions = jest.fn().mockResolvedValue([{ value: 'cust-1', label: 'Acme' }]);
    render(<Harness loadOptions={loadOptions} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.mouseDown(screen.getByText('Acme'));
    expect(input).toHaveValue('Acme');

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown on outside click', async () => {
    const loadOptions = jest.fn().mockResolvedValue([]);
    render(
      <div>
        <Harness loadOptions={loadOptions} />
        <button type="button">outside</button>
      </div>
    );
    fireEvent.focus(screen.getByRole('combobox'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a "no results" row when the search returns nothing', async () => {
    const loadOptions = jest.fn().mockResolvedValue([]);
    render(<Harness loadOptions={loadOptions} />);
    fireEvent.focus(screen.getByRole('combobox'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('filters.noResults')).toBeInTheDocument();
  });
});
