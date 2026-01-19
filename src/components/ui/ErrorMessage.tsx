import React from 'react';

interface ErrorMessageProps {
  /** Error message to display */
  message: string | null | undefined;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable error message component
 *
 * Displays a red error banner with the provided message.
 * Returns null if message is empty/null/undefined.
 *
 * @example
 * ```tsx
 * <ErrorMessage message={error} />
 * <ErrorMessage message="Something went wrong" className="mt-4" />
 * ```
 */
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
