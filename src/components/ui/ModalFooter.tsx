import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

interface ModalFooterProps {
  /** Whether form is currently submitting */
  loading: boolean;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Text for submit button (default: translated 'common.submit') */
  submitText?: string;
  /** Text for cancel button (default: translated 'common.cancel') */
  cancelText?: string;
  /** Disable submit button (in addition to loading state) */
  submitDisabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable modal footer with cancel and submit buttons
 *
 * Standardizes the footer pattern across all modal forms.
 * Submit button shows loading state when loading=true.
 *
 * @example
 * ```tsx
 * <form onSubmit={handleSubmit}>
 *   // ... form fields
 *   <ModalFooter
 *     loading={loading}
 *     onCancel={handleClose}
 *     submitText={t('suppliers.createButton')}
 *   />
 * </form>
 * ```
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  loading,
  onCancel,
  submitText,
  cancelText,
  submitDisabled = false,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex justify-end space-x-3 pt-4 ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelText || t('common.cancel')}
      </Button>
      <Button
        type="submit"
        loading={loading}
        disabled={submitDisabled || loading}
      >
        {submitText || t('common.submit')}
      </Button>
    </div>
  );
};

export default ModalFooter;
