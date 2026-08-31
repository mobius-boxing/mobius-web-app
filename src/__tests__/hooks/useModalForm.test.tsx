import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { useModalForm } from '../../hooks/useModalForm';

type Form = { code: string; description: string };

const defaultValues: Form = { code: '', description: '' };

/**
 * `formState` is a lazy proxy: RHF only re-renders on error changes once
 * something READ `formState.errors` during render. A bare `renderHook` never
 * does, so the subscription is established here.
 */
const setup = (options: Parameters<typeof useModalForm<Form>>[0]) =>
  renderHook(() => {
    const modal = useModalForm<Form>(options);
    void modal.form.formState.errors;
    return modal;
  });

/** An axios-shaped rejection, which is all `handleSubmit` ever sees. */
const httpError = (data: unknown) => ({
  response: { status: 400, data },
  message: 'Request failed with status code 400',
});

describe('useModalForm — server field errors', () => {
  it('pins each field error on its input and leaves the banner clean', async () => {
    const { result } = setup({ defaultValues });

    await act(async () => {
      await result.current.handleSubmit(() =>
        Promise.reject(
          httpError({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'El código es obligatorio',
            errors: [
              { field: 'code', message: 'El código es obligatorio' },
              {
                field: 'description',
                message: 'La descripción no puede superar los 10000 caracteres',
              },
            ],
          })
        )
      )(defaultValues);
    });

    await waitFor(() => {
      expect(result.current.form.formState.errors.code?.message).toBe(
        'El código es obligatorio'
      );
    });
    expect(result.current.form.formState.errors.description?.message).toBe(
      'La descripción no puede superar los 10000 caracteres'
    );
    // Fully mapped: showing the same sentence again in the banner is noise.
    expect(result.current.error).toBe('');
  });

  it('falls back to the banner for a field the form does not register', async () => {
    const { result } = setup({ defaultValues });

    await act(async () => {
      await result.current.handleSubmit(() =>
        Promise.reject(
          httpError({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'La empresa es obligatoria',
            errors: [{ field: 'companyId', message: 'La empresa es obligatoria' }],
          })
        )
      )(defaultValues);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('La empresa es obligatoria');
    });
    expect(result.current.form.formState.errors.code).toBeUndefined();
  });

  it('still shows the banner for an error with no field breakdown', async () => {
    const { result } = setup({ defaultValues });

    await act(async () => {
      await result.current.handleSubmit(() =>
        Promise.reject(
          httpError({
            success: false,
            code: 'DUPLICATE_ENTRY',
            message: 'Duplicate entry. This record already exists.',
          })
        )
      )(defaultValues);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        'Duplicate entry. This record already exists.'
      );
    });
    expect(result.current.form.formState.errors.code).toBeUndefined();
  });
});

describe('useModalForm — optional schema', () => {
  const schema = z.object({
    code: z.string().min(1, 'Código es obligatorio'),
    description: z.string().optional(),
  });

  it('blocks an invalid submit when a schema is supplied', async () => {
    const apiCall = jest.fn().mockResolvedValue(undefined);
    const { result } = setup({
      defaultValues,
      schema: schema as unknown as z.ZodType<Form>,
    });

    await act(async () => {
      await result.current.form.handleSubmit(
        result.current.handleSubmit(apiCall)
      )();
    });

    await waitFor(() => {
      expect(result.current.form.formState.errors.code?.message).toBe(
        'Código es obligatorio'
      );
    });
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('submits once the schema is satisfied', async () => {
    const apiCall = jest.fn().mockResolvedValue(undefined);
    const { result } = setup({
      defaultValues: { code: 'A1', description: '' },
      schema: schema as unknown as z.ZodType<Form>,
    });

    await act(async () => {
      await result.current.form.handleSubmit(
        result.current.handleSubmit(apiCall)
      )();
    });

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(1);
    });
  });

  it('leaves a caller that passes no schema completely unvalidated', async () => {
    // The zero-risk property of this seam: every existing modal passes no
    // schema, so no resolver is installed and nothing about it changes.
    const apiCall = jest.fn().mockResolvedValue(undefined);
    const { result } = setup({ defaultValues });

    await act(async () => {
      await result.current.form.handleSubmit(
        result.current.handleSubmit(apiCall)
      )();
    });

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(1);
    });
    expect(result.current.form.formState.errors.code).toBeUndefined();
  });
});
