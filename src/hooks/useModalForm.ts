import { useState, useCallback } from 'react';
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldValues,
  UseFormProps,
} from 'react-hook-form';

/**
 * Options for configuring the useModalForm hook
 */
export interface UseModalFormOptions<T extends FieldValues> {
  /** Default values for the form fields */
  defaultValues?: DefaultValues<T>;
  /** Callback when form submission succeeds */
  onSuccess?: () => void;
  /** Callback when modal should close */
  onClose?: () => void;
  /** Additional react-hook-form options */
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
}

/**
 * Return type of the useModalForm hook
 */
export interface UseModalFormReturn<T extends FieldValues> {
  /** The react-hook-form instance */
  form: UseFormReturn<T>;
  /** Whether form is currently submitting */
  loading: boolean;
  /** Error message from last submission attempt */
  error: string;
  /** Set the error message manually */
  setError: (error: string) => void;
  /** Clear the current error */
  clearError: () => void;
  /**
   * Create a submit handler that wraps the API call with loading/error handling
   * @param apiCall - The async function to call with form data
   * @returns A function to be used with handleSubmit
   */
  handleSubmit: (
    apiCall: (data: T) => Promise<unknown>
  ) => (data: T) => Promise<void>;
  /** Handle modal close - resets form and clears error */
  handleClose: () => void;
  /** Reset the form to default values and clear error */
  resetForm: () => void;
}

/**
 * Custom hook for managing modal form state
 *
 * Extracts the repeated pattern from modal components:
 * - Loading state management
 * - Error state management
 * - Form submission with try/catch/finally
 * - Form reset on close
 *
 * @example
 * ```tsx
 * const CreateSupplierModal = ({ isOpen, onClose, onSuccess }) => {
 *   const { t } = useTranslation();
 *
 *   const {
 *     form: { register, handleSubmit: formSubmit, formState: { errors } },
 *     loading,
 *     error,
 *     handleSubmit,
 *     handleClose,
 *   } = useModalForm<CreateSupplierForm>({
 *     defaultValues: { suppliesSheets: false },
 *     onSuccess,
 *     onClose,
 *   });
 *
 *   const onSubmit = handleSubmit((data) => suppliersApi.createSupplier(data));
 *
 *   return (
 *     <Modal isOpen={isOpen} onClose={handleClose}>
 *       <form onSubmit={formSubmit(onSubmit)}>
 *         <ErrorMessage message={error} />
 *         <Input {...register('code')} error={errors.code?.message} />
 *         <ModalFooter loading={loading} onCancel={handleClose} />
 *       </form>
 *     </Modal>
 *   );
 * };
 * ```
 */
export function useModalForm<T extends FieldValues>(
  options: UseModalFormOptions<T> = {}
): UseModalFormReturn<T> {
  const { defaultValues, onSuccess, onClose, formOptions } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<T>({
    defaultValues,
    ...formOptions,
  });

  const clearError = useCallback(() => setError(''), []);

  /**
   * Creates a submit handler that wraps the API call with proper state management
   */
  const handleSubmit = useCallback(
    (apiCall: (data: T) => Promise<unknown>) =>
      async (data: T): Promise<void> => {
        setLoading(true);
        setError('');

        try {
          await apiCall(data);
          form.reset();
          onSuccess?.();
        } catch (err: unknown) {
          console.error('Form submission error:', err);

          // Extract error message from various error formats
          let errorMessage = 'An error occurred';
          if (err && typeof err === 'object') {
            const axiosError = err as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            errorMessage =
              axiosError.response?.data?.message ||
              axiosError.message ||
              errorMessage;
          }

          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    [form, onSuccess]
  );

  /**
   * Handle modal close - resets form and clears error
   */
  const handleClose = useCallback(() => {
    form.reset();
    setError('');
    onClose?.();
  }, [form, onClose]);

  /**
   * Reset form to default values and clear error
   */
  const resetForm = useCallback(() => {
    form.reset(defaultValues);
    setError('');
  }, [form, defaultValues]);

  return {
    form,
    loading,
    error,
    setError,
    clearError,
    handleSubmit,
    handleClose,
    resetForm,
  };
}

export default useModalForm;
