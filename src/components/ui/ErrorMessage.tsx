import React from 'react';

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
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
    </div>
  );
};

export default ErrorMessage;
