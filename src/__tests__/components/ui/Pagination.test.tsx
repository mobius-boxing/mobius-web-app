import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from '../../../components/ui/Pagination';

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

const baseProps = {
  page: 3,
  totalPages: 12,
  total: 115,
  limit: 10,
  onPageChange: jest.fn(),
};

describe('Pagination', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders nothing when there is no data', () => {
    const { container } = render(<Pagination {...baseProps} total={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the existing prev/next aria labels and behaviour', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...baseProps} onPageChange={onPageChange} />);

    const next = screen.getByLabelText('Next page');
    const previous = screen.getByLabelText('Previous page');
    expect(next).toBeInTheDocument();
    expect(previous).toBeInTheDocument();

    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(previous);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('wraps the container with flex-wrap and a gap-2', () => {
    const { container } = render(<Pagination {...baseProps} />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('flex-wrap');
    expect(outer.className).toContain('gap-2');
  });

  it('shows numbered page buttons only in a sm-only group', () => {
    render(<Pagination {...baseProps} />);
    const pageButton = screen.getByRole('button', { name: '3' });
    const group = pageButton.parentElement as HTMLElement;
    expect(group.className).toContain('hidden');
    expect(group.className).toContain('sm:flex');
  });

  it('shows the "page / total" text for the sub-sm layout', () => {
    render(<Pagination {...baseProps} />);
    expect(screen.getByText('3 / 12')).toBeInTheDocument();
  });
});
