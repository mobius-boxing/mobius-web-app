import React from 'react';
import { render, screen } from '@testing-library/react';
import Table from '../../../components/ui/Table';

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

    it('should have hover styles on rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const rows = document.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-secondary-50');
      });
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
