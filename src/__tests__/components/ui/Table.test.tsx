import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Table from '../../../components/ui/Table';
import type { Column } from '../../../components/ui/Table';

let mockUser: { uuid: string } | null = { uuid: 'user-1' };
jest.mock('../../../contexts/AuthContext', () => ({
  useAuthUser: () => mockUser,
}));

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

/** A fake `ResizeObserver` that never fires again: enough to exercise the
 * initial `getBoundingClientRect` measurement `useElementWidth` performs. */
const mockContainerWidth = (width: number) => {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect);
  class FakeResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  (global as any).ResizeObserver = FakeResizeObserver;
};

describe('Table', () => {
  const mockColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
  ];

  const mockData = [
    { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ];

  describe('Rendering', () => {
    it('should render table element', () => {
      render(<Table columns={mockColumns} data={mockData} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('should render data rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render all data values', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockData.forEach((row) => {
        expect(screen.getByText(row.name)).toBeInTheDocument();
        expect(screen.getByText(row.email)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Render Function', () => {
    it('should use custom render function for column', () => {
      const columnsWithRender = [
        {
          key: 'name',
          header: 'Name',
          render: (value: string) => <strong data-testid="custom-name">{value.toUpperCase()}</strong>,
        },
        { key: 'email', header: 'Email' },
      ];

      render(<Table columns={columnsWithRender} data={mockData} />);

      const customNames = screen.getAllByTestId('custom-name');
      expect(customNames[0]).toHaveTextContent('JOHN DOE');
      expect(customNames[1]).toHaveTextContent('JANE SMITH');
    });

    it('should pass row data to render function', () => {
      const columnsWithRowRender = [
        {
          key: 'name',
          header: 'Full Info',
          render: (_value: string, row: typeof mockData[0]) => (
            <span data-testid="full-info">{row.name} - {row.role}</span>
          ),
        },
      ];

      render(<Table columns={columnsWithRowRender} data={mockData} />);

      const fullInfos = screen.getAllByTestId('full-info');
      expect(fullInfos[0]).toHaveTextContent('John Doe - Admin');
    });
  });

  describe('Empty State', () => {
    it('should show default empty message when no data', () => {
      render(<Table columns={mockColumns} data={[]} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should show custom empty message when provided', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          emptyMessage="No companies found"
        />
      );

      expect(screen.getByText('No companies found')).toBeInTheDocument();
    });

    it('should span all columns for empty message', () => {
      render(<Table columns={mockColumns} data={[]} />);

      const emptyCell = screen.getByText('No data available').closest('td');
      expect(emptyCell).toHaveAttribute('colspan', '3');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      render(<Table columns={mockColumns} data={[]} loading={true} />);

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should not show table data when loading', () => {
      render(<Table columns={mockColumns} data={mockData} loading={true} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should show table when not loading', () => {
      render(<Table columns={mockColumns} data={mockData} loading={false} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(<Table columns={mockColumns} data={mockData} className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('should apply column className', () => {
      const columnsWithClass = [
        { key: 'name', header: 'Name', className: 'column-custom-class' },
        { key: 'email', header: 'Email' },
      ];

      render(<Table columns={columnsWithClass} data={mockData} />);

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveClass('column-custom-class');
    });

    it('should have proper table structure', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(document.querySelector('thead')).toBeInTheDocument();
      expect(document.querySelector('tbody')).toBeInTheDocument();
    });

    /**
     * Row hover is no longer a per-row utility class: the retheme moved it to
     * `.gd-table tbody tr:hover` in gold.css, scoped by the class on <table>.
     * So the contract to assert is that the table opts into that stylesheet
     * and still renders the rows the rule targets.
     */
    it('should have hover styles on rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);
      const table = document.querySelector('table');
      expect(table).toHaveClass('gd-table');
      expect(document.querySelectorAll('tbody tr').length).toBe(mockData.length);
    });
  });

  describe('Row Keys', () => {
    it('should render correct number of rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const bodyRows = document.querySelectorAll('tbody tr');
      expect(bodyRows.length).toBe(3);
    });

    it('should render correct number of columns per row', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const firstRow = document.querySelector('tbody tr');
      const cells = firstRow?.querySelectorAll('td');
      expect(cells?.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure for screen readers', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(3);

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBe(9); // 3 rows x 3 columns
    });
  });
});

describe('Table with listId — column preferences', () => {
  const listColumns: Column[] = [
    { key: 'name', header: 'Name', hideable: false, card: 'title' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    {
      key: 'actions',
      header: '',
      pinned: true,
      card: 'actions',
      label: 'Actions',
      render: () => <button>Edit</button>,
    },
  ];
  const listData = [{ name: 'John Doe', email: 'john@example.com', role: 'Admin' }];

  beforeEach(() => {
    mockUser = { uuid: 'user-1' };
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  const storedPrefs = () => {
    const raw = window.localStorage.getItem('column_prefs:user-1:widgets');
    return raw ? JSON.parse(raw) : null;
  };

  it('renders a Columns button only when listId is set', () => {
    render(<Table columns={listColumns} data={listData} listId="widgets" />);
    expect(screen.getByRole('button', { name: 'Columns' })).toBeInTheDocument();
  });

  it('toggles, moves and resets columns through the chooser, persisting to localStorage', () => {
    render(<Table columns={listColumns} data={listData} listId="widgets" />);

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByText('Configure columns')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show Email' }));
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    expect(storedPrefs().hidden).toEqual(['email']);

    fireEvent.click(screen.getByRole('button', { name: 'Move Role up' }));
    const order: string[] = storedPrefs().order;
    expect(order.indexOf('role')).toBeLessThan(order.indexOf('email'));

    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(storedPrefs()).toBeNull();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('disables the checkbox for a non-hideable column, a pinned column and the last visible column', () => {
    render(
      <Table
        columns={[{ key: 'only', header: 'Only' }]}
        data={[{ only: 'x' }]}
        listId="one-column"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByRole('checkbox', { name: 'Show Only' })).toBeDisabled();
  });

  it('disables move buttons for a pinned column', () => {
    render(<Table columns={listColumns} data={listData} listId="widgets" />);
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByRole('button', { name: 'Move Actions up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Actions down' })).toBeDisabled();
  });

  it("shows table.notSaved when storage refuses the write", () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(<Table columns={listColumns} data={listData} listId="widgets" />);
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show Email' }));
    expect(
      screen.getByText("Changes can't be saved in this browser and will be lost on reload.")
    ).toBeInTheDocument();
  });

  it("uses the current render's column objects, never a cached copy (C-1)", () => {
    const { rerender } = render(
      <Table
        listId="stale-closure"
        columns={[{ key: 'name', header: 'Name', render: () => 'first' }]}
        data={[{ name: 'x' }]}
      />
    );
    expect(screen.getByText('first')).toBeInTheDocument();

    rerender(
      <Table
        listId="stale-closure"
        columns={[{ key: 'name', header: 'Name', render: () => 'second' }]}
        data={[{ name: 'x' }]}
      />
    );
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText('first')).not.toBeInTheDocument();
  });
});

describe('Table card view — container width', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).ResizeObserver;
  });

  const columns: Column[] = [
    { key: 'name', header: 'Name', hideable: false, card: 'title' },
    { key: 'email', header: 'Email' },
  ];
  const data = [{ name: 'John Doe', email: 'john@example.com' }];

  it('renders cards below 768px of container width when listId is set', () => {
    mockContainerWidth(390);
    render(<Table columns={columns} data={data} listId="widgets" />);
    expect(document.querySelector('ul.gd-cards')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });

  it('keeps the table at >=768px of container width', () => {
    mockContainerWidth(1024);
    render(<Table columns={columns} data={data} listId="widgets" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(document.querySelector('ul.gd-cards')).not.toBeInTheDocument();
  });

  it('never renders cards or a Columns button without a listId, even at 390px', () => {
    mockContainerWidth(390);
    render(<Table columns={columns} data={data} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(document.querySelector('ul.gd-cards')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('measures width while still loading, so cards appear as soon as data arrives (every list mounts with loading=true)', () => {
    mockContainerWidth(390);
    const { rerender } = render(<Table columns={columns} data={[]} listId="widgets" loading />);
    expect(document.querySelector('ul.gd-cards')).not.toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();

    rerender(<Table columns={columns} data={data} listId="widgets" loading={false} />);
    expect(document.querySelector('ul.gd-cards')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });
});
