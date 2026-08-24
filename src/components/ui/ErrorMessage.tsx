import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null | undefined;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-2.5 gd-alert gd-alert-danger ${className}`}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
      <p className="text-sm text-red-800">{message}</p>
    </div>
  );
};

export default ErrorMessage;
