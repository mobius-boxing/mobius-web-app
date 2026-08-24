import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Models from '../../pages/Models';

/**
 * Two behaviours of the Modelos page that regressed in review:
 *
 *  - the designed 409 from DELETE (a model still referenced by parts) must
 *    reach the user; swallowing it into the logger leaves the row silently in
 *    place, which reads as "nothing happened";
 *  - "Campos y funciones" is a modal opened from inside another modal, the only
 *    such pairing in the app. Escape must close the popup ONLY: closing the
 *    form under it discards every unsaved formula.
 *
 * `t` is mocked to `##<key>##`, so a hardcoded literal shows up as a plain
 * string and a server message is recognisable by not being a `##…##` key.
 */
const mockGetModels = jest.fn();
const mockGetModel = jest.fn();
const mockDeleteModel = jest.fn();
const mockGetFormulaReference = jest.fn();

jest.mock('../../services/api', () => ({
  modelsApi: {
    getModels: (...args: any[]) => mockGetModels(...args),
    getModel: (...args: any[]) => mockGetModel(...args),
    deleteModel: (...args: any[]) => mockDeleteModel(...args),
    createModel: jest.fn(),
    updateModel: jest.fn(),
    testFormula: jest.fn(),
    getFormulaReference: (...args: any[]) => mockGetFormulaReference(...args),
  },
  flapTypesApi: { getFlapTypes: async () => ({ data: [] }) },
  complementsApi: { getComplements: async () => ({ data: [] }) },
  filesApi: { getFile: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `##${key}##` }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
}));

const MODEL = {
  uuid: 'model-1',
  code: 'M-1',
  description: 'Caja regular',
  flapType: null,
  complement: null,
};

const page = (data: any[]) => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetModels.mockResolvedValue(page([MODEL]));
  mockGetModel.mockResolvedValue({ ...MODEL, sheetLengthFormula: '2*[Largo]' });
  mockGetFormulaReference.mockResolvedValue({
    parameters: [{ name: 'Largo', label: 'Largo', example: 100 }],
    functions: [],
    operators: [],
  });
});

const renderPage = async () => {
  render(<Models />);
  await waitFor(() => expect(mockGetModels).toHaveBeenCalled());
  await screen.findByText('M-1');
};

describe('deleting a referenced model', () => {
  it('surfaces the API 409 instead of dropping it in the log', async () => {
    mockDeleteModel.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Cannot delete model: 3 part(s) still reference it.' },
      },
    });
    await renderPage();

    fireEvent.click(screen.getByTitle('##models.deleteModel##'));
    fireEvent.click(await screen.findByText('##confirmModal.confirm##'));

    expect(
      await screen.findByText('Cannot delete model: 3 part(s) still reference it.'),
    ).toBeInTheDocument();
  });

  it('falls back to a translated message when the server sends none', async () => {
    mockDeleteModel.mockRejectedValue(new Error('Network Error'));
    await renderPage();

    fireEvent.click(screen.getByTitle('##models.deleteModel##'));
    fireEvent.click(await screen.findByText('##confirmModal.confirm##'));

    expect(
      await screen.findByText('##models.deleteError##'),
    ).toBeInTheDocument();
  });
});

describe('the formula reference popup over the model form', () => {
  it('closes only the popup on Escape and keeps the form values', async () => {
    await renderPage();

    fireEvent.click(screen.getByTitle('##models.editModel##'));
    const code = await screen.findByTestId('model-code');
    await waitFor(() => expect(code).toHaveValue('M-1'));
    fireEvent.change(code, { target: { value: 'M-1-EDITADO' } });

    fireEvent.click(screen.getByTestId('model-open-reference'));
    expect(await screen.findByTestId('formula-reference-filter')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByTestId('formula-reference-filter')).toBeNull(),
    );
    // The form is still up, with the unsaved edit intact.
    expect(screen.getByTestId('model-code')).toHaveValue('M-1-EDITADO');
  });

  it('closes the form itself on the next Escape', async () => {
    await renderPage();

    fireEvent.click(screen.getByTitle('##models.editModel##'));
    await screen.findByTestId('model-code');
    fireEvent.click(screen.getByTestId('model-open-reference'));
    await screen.findByTestId('formula-reference-filter');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByTestId('formula-reference-filter')).toBeNull(),
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('model-code')).toBeNull());
  });
});
