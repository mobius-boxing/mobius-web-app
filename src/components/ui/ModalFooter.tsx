import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

interface ModalFooterProps {
  loading: boolean;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  className?: string;
}

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
