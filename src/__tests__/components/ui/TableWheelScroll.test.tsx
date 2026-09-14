import React from 'react';
import { render } from '@testing-library/react';
import Table from '../../../components/ui/Table';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
];
const data = [{ name: 'Ada', email: 'ada@example.com' }];

const makeOverflow = (el: HTMLElement) => {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 2400 });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: 900 });
};

const wheel = (el: HTMLElement, deltaY: number) => {
  const event = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
  el.dispatchEvent(event);
  return event;
};

describe('Table wheel → horizontal scroll', () => {
  it('scrolls the table sideways with the wheel when it overflows', () => {
    const { container } = render(<Table columns={columns} data={data} />);
    const scroller = container.querySelector('table')!.parentElement as HTMLElement;
    makeOverflow(scroller);

    expect(wheel(scroller, 200).defaultPrevented).toBe(true);
    expect(scroller.scrollLeft).toBe(200);
  });

  it('re-attaches after the loading skeleton is replaced by the table', () => {
    const { container, rerender } = render(<Table columns={columns} data={[]} loading />);
    expect(container.querySelector('table')).toBeNull();

    rerender(<Table columns={columns} data={data} />);
    const scroller = container.querySelector('table')!.parentElement as HTMLElement;
    makeOverflow(scroller);

    expect(wheel(scroller, 150).defaultPrevented).toBe(true);
    expect(scroller.scrollLeft).toBe(150);
  });

  it('lets the page scroll when the table fits', () => {
    const { container } = render(<Table columns={columns} data={data} />);
    const scroller = container.querySelector('table')!.parentElement as HTMLElement;

    expect(wheel(scroller, 200).defaultPrevented).toBe(false);
  });
});
