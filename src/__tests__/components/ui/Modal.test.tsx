import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../../components/ui/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal content when open', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button by default', () => {
      render(<Modal {...defaultProps} title="Title" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<Modal isOpen={true} onClose={onClose} title="Title">Content</Modal>);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]); // Click the close button

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);

      // Post-retheme the backdrop is `.gd-modal-overlay` (gold.css), not a
      // `bg-opacity-75` utility. Same element, same onClick.
      const backdrop = document.querySelector('.gd-modal-overlay');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Events', () => {
    it('should call onClose when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose for other keys', () => {
      const onClose = jest.fn();
      render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('should render medium size by default', () => {
      render(<Modal {...defaultProps} />);
      const modal = document.querySelector('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });

    it('should render small size', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modal = document.querySelector('.max-w-md');
      expect(modal).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modal = document.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('should render xl size', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modal = document.querySelector('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });

    it('should render 2xl size', () => {
      render(<Modal {...defaultProps} size="2xl" />);
      const modal = document.querySelector('.max-w-6xl');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should unlock body scroll on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Structure', () => {
    it('should have proper z-index for overlay', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have fixed positioning', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.rounded-lg');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('should render complex children', () => {
      render(
        <Modal {...defaultProps}>
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Modal {...defaultProps}>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </Modal>
      );

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });
});
