import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDragReorder, UseDragReorderResult } from '../../hooks/useDragReorder';

let api: UseDragReorderResult;

function Harness(props: {
  onDrop: (from: string, to: string) => void;
  canDrag?: (key: string) => boolean;
  canDrop?: (key: string) => boolean;
  threshold?: number;
}) {
  api = useDragReorder({
    onDrop: props.onDrop,
    canDrag: props.canDrag ?? (() => true),
    canDrop: props.canDrop ?? (() => true),
    threshold: props.threshold,
  });
  return (
    <>
      {['a', 'b', 'c'].map((key) => (
        <div
          key={key}
          data-testid={`row-${key}`}
          {...api.getTargetProps(key)}
          {...api.getHandleProps(key)}
        />
      ))}
    </>
  );
}

/** jsdom has no real layout engine and no `elementFromPoint` at all; every drag test drives
 * the target lookup by stubbing it to return a specific row, independent of the (irrelevant)
 * coordinates. */
const stubElementFromPoint = (el: Element | null) => {
  document.elementFromPoint = jest.fn().mockReturnValue(el);
};

/** jsdom has no `PointerEvent` class, so `@testing-library/dom`'s `fireEvent.pointerDown(...)`
 * falls back to the plain `Event` constructor, which silently drops `pointerId`/`clientX`/
 * `clientY` (not recognized `EventInit` fields) — they come back `undefined` in the handler.
 * Building the event by hand and assigning those as own properties before dispatch is the
 * only way to get real values through. */
const firePointer = (type: string, testId: string, pointerId = 1, x = 0, y = 0) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId, clientX: x, clientY: y });
  fireEvent(screen.getByTestId(testId), event);
};
const down = (testId: string, pointerId = 1, x = 0, y = 0) => firePointer('pointerdown', testId, pointerId, x, y);
const move = (testId: string, pointerId = 1, x = 0, y = 0) => firePointer('pointermove', testId, pointerId, x, y);
const up = (testId: string, pointerId = 1, x = 0, y = 0) => firePointer('pointerup', testId, pointerId, x, y);

afterEach(() => {
  jest.restoreAllMocks();
  delete (document as any).elementFromPoint;
});

describe('useDragReorder', () => {
  it('does not start a drag before the threshold is crossed', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 3, 0); // 3px, under the default 5px threshold
    expect(api.draggingKey).toBeNull();

    up('row-a', 1, 3, 0);
    expect(onDrop).not.toHaveBeenCalled();
    expect(api.wasDragged()).toBe(false);
  });

  it('fires onDrop exactly once when dropped on a valid, different target', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-c'));

    down('row-a');
    move('row-a', 1, 10, 0);
    expect(api.draggingKey).toBe('a');
    expect(api.overKey).toBe('c');
    expect(api.dropSide).toBe('after'); // c follows a in DOM order

    up('row-a', 1, 10, 0);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith('a', 'c');
    expect(api.draggingKey).toBeNull();
    expect(api.wasDragged()).toBe(true);
  });

  it('reports "before" when dropping on an earlier target', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-a'));

    down('row-c');
    move('row-c', 1, 10, 0);
    expect(api.dropSide).toBe('before'); // a precedes c in DOM order

    up('row-c', 1, 10, 0);
    expect(onDrop).toHaveBeenCalledWith('c', 'a');
  });

  it('cancels on Escape with no onDrop and no lingering drag state', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 10, 0);
    expect(api.draggingKey).toBe('a');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(api.draggingKey).toBeNull();
    expect(api.overKey).toBeNull();

    up('row-a', 1, 10, 0);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('cancels on pointercancel with no onDrop', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 10, 0);
    firePointer('pointercancel', 'row-a', 1, 10, 0);

    expect(api.draggingKey).toBeNull();
    up('row-a', 1, 10, 0);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('never starts a drag for a key canDrag rejects', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} canDrag={(key) => key !== 'a'} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 10, 0);
    expect(api.draggingKey).toBeNull();
  });

  it('never reports a target canDrop rejects, and drop does not fire over it', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} canDrop={(key) => key !== 'b'} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 10, 0);
    expect(api.overKey).toBeNull();

    up('row-a', 1, 10, 0);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('respects a custom threshold', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} threshold={20} />);
    stubElementFromPoint(screen.getByTestId('row-b'));

    down('row-a');
    move('row-a', 1, 10, 0); // under the 20px threshold
    expect(api.draggingKey).toBeNull();

    move('row-a', 1, 25, 0); // now past it
    expect(api.draggingKey).toBe('a');
  });

  it('wasDragged() resets on the next pointerdown', () => {
    const onDrop = jest.fn();
    render(<Harness onDrop={onDrop} />);
    stubElementFromPoint(screen.getByTestId('row-c'));

    down('row-a');
    move('row-a', 1, 10, 0);
    up('row-a', 1, 10, 0);
    expect(api.wasDragged()).toBe(true);

    down('row-b');
    expect(api.wasDragged()).toBe(false);
  });
});
