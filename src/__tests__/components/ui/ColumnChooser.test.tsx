import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ColumnChooser } from '../../../components/ui/ColumnChooser';
import type { ColumnState } from '../../../hooks/useColumnPreferences';
import type { Column } from '../../../components/ui/Table';

jest.mock('react-i18next', () => {
  const en = jest.requireActual('../../../i18n/locales/en/common.json');
  const lookup = (key: string) =>
    key.split('.').reduce<any>((acc, k) => (acc == null ? acc : acc[k]), en);
  return {
    useTranslation: () => ({
      t: (key: string, opts?: any) => {
        const value = lookup(key);
        if (typeof value !== 'string') return opts?.defaultValue ?? key;
        return value.replace(/\{\{(\w+)\}\}/g, (_m: string, name: string) =>
          opts && opts[name] != null ? String(opts[name]) : ''
        );
      },
    }),
  };
});

const col = (key: string, extra: Partial<Column> = {}): Column => ({ key, header: key, ...extra });

const states = (): ColumnState[] => [
  { column: col('name', { hideable: false }), visible: true, hideable: false, pinned: false },
  { column: col('email'), visible: true, hideable: true, pinned: false },
  { column: col('role'), visible: false, hideable: true, pinned: false },
  { column: col('actions', { pinned: true }), visible: true, hideable: false, pinned: true },
];

const baseProps = () => ({
  isOpen: true,
  onClose: jest.fn(),
  states: states(),
  isCustomized: false,
  isPersisted: true,
  onToggle: jest.fn(),
  onMove: jest.fn(),
  onMoveTo: jest.fn(),
  onReset: jest.fn(),
});

describe('ColumnChooser', () => {
  it('renders a hint, one row per state, badges for pinned/always-visible, and calls onToggle/onMove', () => {
    const props = baseProps();
    render(<ColumnChooser {...props} />);

    expect(screen.getByText(/Changes are saved in this browser/)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);

    expect(screen.getByText('Fixed position')).toBeInTheDocument();
    expect(screen.getByText('Always visible')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show role' }));
    expect(props.onToggle).toHaveBeenCalledWith('role', true);

    fireEvent.click(screen.getByRole('button', { name: 'Move email up' }));
    expect(props.onMove).toHaveBeenCalledWith('email', -1);
  });

  it('disables the checkbox for a non-hideable column and for a pinned column', () => {
    render(<ColumnChooser {...baseProps()} />);
    expect(screen.getByRole('checkbox', { name: 'Show name' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Show actions' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Show email' })).not.toBeDisabled();
  });

  it('disables the checkbox for the last visible column', () => {
    const oneVisible: ColumnState[] = [
      { column: col('a'), visible: true, hideable: true, pinned: false },
      { column: col('b'), visible: false, hideable: true, pinned: false },
    ];
    render(<ColumnChooser {...baseProps()} states={oneVisible} />);
    expect(screen.getByRole('checkbox', { name: 'Show a' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Show b' })).not.toBeDisabled();
  });

  it('disables move buttons for pinned rows in both directions', () => {
    render(<ColumnChooser {...baseProps()} />);
    expect(screen.getByRole('button', { name: 'Move actions up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move actions down' })).toBeDisabled();
  });

  it('disables a move button when no unpinned neighbour exists in that direction', () => {
    // name(unlocked) is first; only pinned columns sit before it.
    const withLeadingPinned: ColumnState[] = [
      { column: col('select', { pinned: true }), visible: true, hideable: false, pinned: true },
      { column: col('name'), visible: true, hideable: true, pinned: false },
      { column: col('actions', { pinned: true }), visible: true, hideable: false, pinned: true },
    ];
    render(<ColumnChooser {...baseProps()} states={withLeadingPinned} />);
    expect(screen.getByRole('button', { name: 'Move name up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move name down' })).toBeDisabled();
  });

  it('shows table.notSaved only when !isPersisted', () => {
    const { rerender } = render(<ColumnChooser {...baseProps()} isPersisted={false} />);
    expect(screen.getByText(/can't be saved/)).toBeInTheDocument();

    rerender(<ColumnChooser {...baseProps()} isPersisted={true} />);
    expect(screen.queryByText(/can't be saved/)).not.toBeInTheDocument();
  });

  it('enables Reset only when isCustomized, and Close calls onClose', () => {
    const props = baseProps();
    const { rerender } = render(<ColumnChooser {...props} isCustomized={false} />);
    expect(screen.getByRole('button', { name: 'Reset to default' })).toBeDisabled();

    rerender(<ColumnChooser {...props} isCustomized={true} />);
    expect(screen.getByRole('button', { name: 'Reset to default' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(props.onReset).toHaveBeenCalledTimes(1);

    // Modal's own header "X" is also named "Close" (common.close); the footer
    // button is the last one rendered.
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(<ColumnChooser {...baseProps()} isOpen={false} />);
    expect(screen.queryByText('Configure columns')).not.toBeInTheDocument();
  });
});

describe('ColumnChooser — drag reorder', () => {
  /** jsdom has no `PointerEvent`; `fireEvent.pointerDown(...)` silently drops `pointerId`/
   * `clientX`/`clientY`, so the event is built by hand (see useDragReorder.test.tsx). */
  const firePointer = (type: string, el: Element, pointerId = 1, x = 0, y = 0) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { pointerId, clientX: x, clientY: y });
    fireEvent(el, event);
  };

  beforeEach(() => {
    document.elementFromPoint = jest.fn();
  });

  afterEach(() => {
    delete (document as any).elementFromPoint;
  });

  it('dragging row role onto row name calls onMoveTo(role, name)', () => {
    const props = baseProps();
    render(<ColumnChooser {...props} />);

    const handle = screen.getByRole('button', { name: 'Drag to reorder role' });
    const nameRow = screen.getByRole('checkbox', { name: 'Show name' }).closest('li')!;
    (document.elementFromPoint as jest.Mock).mockReturnValue(nameRow);

    firePointer('pointerdown', handle, 1, 0, 0);
    firePointer('pointermove', handle, 1, 0, 20);
    firePointer('pointerup', handle, 1, 0, 20);

    expect(props.onMoveTo).toHaveBeenCalledWith('role', 'name');
  });

  it('gives pinned rows no active drag handle', () => {
    render(<ColumnChooser {...baseProps()} />);
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder actions' })
    ).not.toBeInTheDocument();
  });
});
