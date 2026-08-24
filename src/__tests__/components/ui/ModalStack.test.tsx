import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../../components/ui/Modal';

/**
 * Nested modals — a popup opened from a form (`ModelFormModal` →
 * `FormulaReferenceModal`), the only such pairing in this app.
 *
 * Both instances register a DOCUMENT-level keydown listener and both toggle
 * `document.body.style.overflow`, so before the stack landed one Escape fired
 * BOTH `onClose` handlers (closing the form and discarding its unsaved input)
 * and closing the popup unlocked background scroll while the form was still up.
 */
const twoModals = (outerOpen: boolean, innerOpen: boolean, closeOuter: () => void, closeInner: () => void) => (
  <>
    <Modal isOpen={outerOpen} onClose={closeOuter}>
      Outer content
    </Modal>
    <Modal isOpen={innerOpen} onClose={closeInner}>
      Inner content
    </Modal>
  </>
);

describe('Modal stacking', () => {
  it('gives Escape to the topmost modal only', () => {
    const closeOuter = jest.fn();
    const closeInner = jest.fn();
    const { rerender } = render(
      twoModals(true, false, closeOuter, closeInner),
    );

    rerender(twoModals(true, true, closeOuter, closeInner));
    expect(screen.getByText('Inner content')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it('hands Escape back to the modal underneath once the top one closes', () => {
    const closeOuter = jest.fn();
    const closeInner = jest.fn();
    const { rerender } = render(twoModals(true, true, closeOuter, closeInner));

    rerender(twoModals(true, false, closeOuter, closeInner));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeOuter).toHaveBeenCalledTimes(1);
    expect(closeInner).not.toHaveBeenCalled();
  });

  it('keeps background scroll locked while any modal is still open', () => {
    const closeOuter = jest.fn();
    const closeInner = jest.fn();
    const { rerender } = render(twoModals(true, true, closeOuter, closeInner));
    expect(document.body.style.overflow).toBe('hidden');

    rerender(twoModals(true, false, closeOuter, closeInner));
    expect(document.body.style.overflow).toBe('hidden');

    rerender(twoModals(false, false, closeOuter, closeInner));
    expect(document.body.style.overflow).toBe('unset');
  });
});
