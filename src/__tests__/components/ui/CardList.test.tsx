import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CardList from '../../../components/ui/CardList';
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

type Row = { name: string; email: string; role: string; secret: string };

const row: Row = { name: 'John Doe', email: 'john@example.com', role: 'Admin', secret: 'never-shown' };

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', card: 'title' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'actions',
    header: '',
    card: 'actions',
    render: () => <button>Edit</button>,
  },
];

describe('CardList', () => {
  it('shows the empty message and no cards when data is empty', () => {
    render(<CardList data={[]} columns={columns} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(document.querySelector('.gd-card')).not.toBeInTheDocument();
  });

  it('groups cells into title, field and action regions, following column order, and renders only given columns', () => {
    render(<CardList data={[row]} columns={columns} emptyMessage="empty" />);

    const card = document.querySelector('.gd-card') as HTMLElement;
    expect(card).toBeInTheDocument();

    const head = card.querySelector('.gd-card__head') as HTMLElement;
    expect(head).toHaveTextContent('John Doe');

    const fields = card.querySelector('.gd-card__fields') as HTMLElement;
    const dts = Array.from(fields.querySelectorAll('dt')).map((n) => n.textContent);
    const dds = Array.from(fields.querySelectorAll('dd')).map((n) => n.textContent);
    expect(dts).toEqual(['Email', 'Role']);
    expect(dds).toEqual(['john@example.com', 'Admin']);

    const actions = card.querySelector('.gd-card__actions') as HTMLElement;
    expect(actions).toHaveTextContent('Edit');

    // A field this row carries but that isn't in `columns` (Table already
    // hid/omitted it) never appears anywhere in the card (I-12).
    expect(screen.queryByText('never-shown')).not.toBeInTheDocument();
  });

  it('falls back to the first visible column as the head when no column is card:"title"', () => {
    const noTitle: Column<Row>[] = [
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
    ];
    render(<CardList data={[row]} columns={noTitle} emptyMessage="empty" />);
    const head = document.querySelector('.gd-card__head') as HTMLElement;
    expect(head).toHaveTextContent('john@example.com');
  });

  it('renders renderExpanded as a full-width block between the fields and the actions', () => {
    render(
      <CardList
        data={[row]}
        columns={columns}
        emptyMessage="empty"
        renderExpanded={(r) => <div data-testid="expanded">{r.name} details</div>}
      />
    );
    expect(screen.getByTestId('expanded')).toHaveTextContent('John Doe details');
    expect(document.querySelector('.gd-card__expanded')?.textContent).toContain('John Doe details');
  });

  it('renders a sort select and direction toggle that emit onSort like a header click', () => {
    const onSort = jest.fn();
    const { rerender } = render(
      <CardList data={[row]} columns={columns} emptyMessage="empty" onSort={onSort} sortBy={null} />
    );

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'role' } });
    expect(onSort).toHaveBeenCalledWith('role', 'asc');

    rerender(
      <CardList
        data={[row]}
        columns={columns}
        emptyMessage="empty"
        onSort={onSort}
        sortBy="role"
        sortOrder="asc"
      />
    );
    fireEvent.click(screen.getByLabelText('Ascending'));
    expect(onSort).toHaveBeenCalledWith('role', 'desc');
  });

  it('renders no sort control when no visible column is sortable', () => {
    const onSort = jest.fn();
    const noSortable: Column<Row>[] = [{ key: 'name', header: 'Name', card: 'title' }];
    render(<CardList data={[row]} columns={noSortable} emptyMessage="empty" onSort={onSort} />);
    expect(screen.queryByLabelText('Sort by')).not.toBeInTheDocument();
  });
});
