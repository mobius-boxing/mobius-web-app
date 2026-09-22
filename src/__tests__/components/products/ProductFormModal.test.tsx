import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductFormModal from '../../../components/products/ProductFormModal';

/**
 * AC-14 — the 4-tab product modal (remove-composite-products). Covers what
 * the manual browser script cannot pin down mechanically: exactly one save
 * request with a flat body, the outer-dim → calculate → inner-card cascade,
 * and the "jump to the first tab with an error" requirement.
 */
const mockGetCustomers = jest.fn();
const mockGetCorrugations = jest.fn();
const mockGetModels = jest.fn();
const mockGetFlapTypes = jest.fn();
const mockGetGlueTypes = jest.fn();
const mockGetStrappingTypes = jest.fn();
const mockGetTraceTypes = jest.fn();
const mockGetComplements = jest.fn();
const mockGetPalletizations = jest.fn();
const mockGetRoutes = jest.fn();
const mockGetRoute = jest.fn();
const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockCalculate = jest.fn();

jest.mock('../../../services/api', () => ({
  customersApi: { getCustomers: (...args: any[]) => mockGetCustomers(...args) },
  corrugationsApi: { getCorrugations: (...args: any[]) => mockGetCorrugations(...args) },
  modelsApi: { getModels: (...args: any[]) => mockGetModels(...args) },
  flapTypesApi: { getFlapTypes: (...args: any[]) => mockGetFlapTypes(...args) },
  glueTypesApi: { getGlueTypes: (...args: any[]) => mockGetGlueTypes(...args) },
  strappingTypesApi: { getStrappingTypes: (...args: any[]) => mockGetStrappingTypes(...args) },
  traceTypesApi: { getTraceTypes: (...args: any[]) => mockGetTraceTypes(...args) },
  complementsApi: { getComplements: (...args: any[]) => mockGetComplements(...args) },
  palletizationsApi: { getPalletizations: (...args: any[]) => mockGetPalletizations(...args) },
  productionRoutesApi: {
    getRoutes: (...args: any[]) => mockGetRoutes(...args),
    getRoute: (...args: any[]) => mockGetRoute(...args),
  },
  productsApi: {
    createProduct: (...args: any[]) => mockCreateProduct(...args),
    updateProduct: (...args: any[]) => mockUpdateProduct(...args),
    calculate: (...args: any[]) => mockCalculate(...args),
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuthUser: () => null,
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin', permissions: ['products.approve.technical'] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  useEffectiveCompany: () => ({ effectiveCompanyId: undefined }),
  default: () => ({ effectiveCompanyId: undefined }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const page = (data: any[]) => ({ data, total: data.length, page: 1, limit: 100, totalPages: 1 });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCustomers.mockResolvedValue(page([{ uuid: 'cust-1', name: 'Cliente Uno' }]));
  mockGetCorrugations.mockResolvedValue(page([{ uuid: 'corr-1', code: 'C-450' }]));
  mockGetModels.mockResolvedValue(page([]));
  mockGetFlapTypes.mockResolvedValue(page([]));
  mockGetGlueTypes.mockResolvedValue(page([]));
  mockGetStrappingTypes.mockResolvedValue(page([]));
  mockGetTraceTypes.mockResolvedValue(page([]));
  mockGetComplements.mockResolvedValue(page([]));
  mockGetPalletizations.mockResolvedValue(page([]));
  mockGetRoutes.mockResolvedValue(page([]));
  mockGetRoute.mockResolvedValue({ uuid: 'route-1', name: 'Ruta', isGlobal: true, stages: [] });
  mockCreateProduct.mockResolvedValue({ uuid: 'prod-1' });
});

const renderModal = async (props: Partial<React.ComponentProps<typeof ProductFormModal>> = {}) => {
  const utils = render(
    <ProductFormModal mode="create" isOpen onClose={jest.fn()} onSuccess={jest.fn()} product={null} {...props} />,
  );
  await waitFor(() => expect(mockGetCustomers).toHaveBeenCalled());
  await screen.findByRole('tablist');
  // Modal renders through a portal into <body>, so `container` (the render
  // root) never holds the form; hand callers the body instead.
  return { ...utils, container: utils.baseElement as HTMLElement };
};

const switchTab = async (key: 'general' | 'production' | 'route' | 'palletizing') => {
  fireEvent.click(screen.getByRole('tab', { name: `products.tabs.${key}` }));
};

describe('ProductFormModal tabs (AC-14)', () => {
  it('renders the 4 tabs, in the mockup order', async () => {
    await renderModal();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'products.tabs.general',
      'products.tabs.production',
      'products.tabs.route',
      'products.tabs.palletizing',
    ]);
  });
});

describe('ProductFormModal save (AC-14)', () => {
  it('issues exactly one createProduct call with a flat body', async () => {
    const onSuccess = jest.fn();
    const { container } = await renderModal({ onSuccess });

    fireEvent.change(container.querySelector('[name="code"]')!, { target: { value: 'CAJA-01' } });
    fireEvent.change(container.querySelector('[name="customerId"]')!, { target: { value: 'cust-1' } });

    await switchTab('production');
    await waitFor(() =>
      expect(container.querySelector('[name="corrugationUuid"] option[value="corr-1"]')).toBeInTheDocument(),
    );
    fireEvent.change(container.querySelector('[name="corrugationUuid"]')!, { target: { value: 'corr-1' } });

    fireEvent.click(screen.getByText('products.saveButton'));

    await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledTimes(1));
    expect(mockUpdateProduct).not.toHaveBeenCalled();
    const payload = mockCreateProduct.mock.calls[0][0];
    expect(payload.code).toBe('CAJA-01');
    expect(payload.customerId).toBe('cust-1');
    expect(payload.corrugationUuid).toBe('corr-1');
    // Read-only / stripped keys never travel from the form (C-12).
    expect(payload).not.toHaveProperty('boxWeight');
    expect(payload).not.toHaveProperty('approvalStatus');
    expect(payload).not.toHaveProperty('effectiveGrammage');
    expect(payload).not.toHaveProperty('sheetSurface');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('issues exactly one updateProduct call in edit mode', async () => {
    const product: any = {
      uuid: 'prod-9',
      code: 'CAJA-09',
      revision: 0,
      vip: false,
      symmetricScoreLines: false,
      printCode: false,
      printDate: false,
      printRecyclable: false,
      printWarranty: false,
      printLogo: false,
      printNationalIndustry: false,
      printExport: false,
      allowsRotation: false,
      allowsPartialRotation: false,
      mandatoryRotation: false,
      allowsGluing: false,
      approvalStatus: 'pending',
      customer: { uuid: 'cust-1', name: 'Cliente Uno' },
      corrugation: { uuid: 'corr-1', code: 'C-450' },
    };
    mockUpdateProduct.mockResolvedValue({ ...product, description: 'updated' });

    await renderModal({ mode: 'edit', product });

    fireEvent.click(screen.getByText('products.saveButton'));

    await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalledTimes(1));
    expect(mockCreateProduct).not.toHaveBeenCalled();
    expect(mockUpdateProduct.mock.calls[0][0]).toBe('prod-9');
  });
});

describe('ProductFormModal tab 2 calculate cascade (AC-14, D-27)', () => {
  it('calls calculate on an outer-dim blur and updates the inner-dimension cards', async () => {
    const { container } = await renderModal();
    await switchTab('production');

    await waitFor(() =>
      expect(container.querySelector('[name="corrugationUuid"] option[value="corr-1"]')).toBeInTheDocument(),
    );
    fireEvent.change(container.querySelector('[name="corrugationUuid"]')!, { target: { value: 'corr-1' } });

    mockCalculate.mockResolvedValue({
      boxLength: 600,
      boxWidth: 400,
      boxHeight: 300,
      externalLength: 604,
      externalWidth: 404,
      externalHeight: 304,
      boxSurface: 2.2042,
      boxWeight: 0.99189,
      grammage: null,
      effectiveGrammage: 450,
    });

    const externalLengthInput = container.querySelector('[name="externalLength"]') as HTMLInputElement;
    fireEvent.change(externalLengthInput, { target: { value: '604' } });
    fireEvent.blur(externalLengthInput);

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));
    expect(mockCalculate.mock.calls[0][0]).toMatchObject({
      corrugationUuid: 'corr-1',
      field: 'externalLength',
      value: 604,
    });
    // Input values travel as numbers or null, never the inputs' raw strings.
    expect(mockCalculate.mock.calls[0][0].values).toMatchObject({
      externalLength: 604,
      externalWidth: null,
      boxSurface: null,
      grammage: null,
    });

    await waitFor(() => expect(screen.getByText('600')).toBeInTheDocument());
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('does not call calculate before a corrugation is selected', async () => {
    const { container } = await renderModal();
    await switchTab('production');

    const externalLengthInput = container.querySelector('[name="externalLength"]') as HTMLInputElement;
    fireEvent.change(externalLengthInput, { target: { value: '604' } });
    fireEvent.blur(externalLengthInput);

    await waitFor(() => expect(screen.getByText('products.calculate.corrugationRequired')).toBeInTheDocument());
    expect(mockCalculate).not.toHaveBeenCalled();
  });
});

describe('ProductFormModal calculate only on edits, and save waits for it', () => {
  const editProduct: any = {
    uuid: 'prod-7',
    code: 'CAJA-07',
    revision: 0,
    vip: false,
    symmetricScoreLines: false,
    printCode: false,
    printDate: false,
    printRecyclable: false,
    printWarranty: false,
    printLogo: false,
    printNationalIndustry: false,
    printExport: false,
    allowsRotation: false,
    allowsPartialRotation: false,
    mandatoryRotation: false,
    allowsGluing: false,
    approvalStatus: 'pending',
    customer: { uuid: 'cust-1', name: 'Cliente Uno' },
    corrugation: { uuid: 'corr-1', code: 'C-450' },
    externalLength: 604,
    boxLength: 600,
  };

  it('does not call calculate when an outer dim is blurred without a change', async () => {
    const { container } = await renderModal({ mode: 'edit', product: editProduct });
    await switchTab('production');

    const externalLengthInput = container.querySelector('[name="externalLength"]') as HTMLInputElement;
    fireEvent.focus(externalLengthInput);
    fireEvent.blur(externalLengthInput);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it('saves the values of a calculation still in flight when Guardar is clicked', async () => {
    let finishCalculate: (value: any) => void = () => {};
    mockCalculate.mockImplementation(
      () => new Promise((resolve) => {
        finishCalculate = resolve;
      }),
    );
    mockUpdateProduct.mockResolvedValue(editProduct);
    const { container } = await renderModal({ mode: 'edit', product: editProduct });
    await switchTab('production');
    await waitFor(() =>
      expect(container.querySelector('[name="corrugationUuid"] option[value="corr-1"]')).toBeInTheDocument(),
    );

    const externalLengthInput = container.querySelector('[name="externalLength"]') as HTMLInputElement;
    fireEvent.change(externalLengthInput, { target: { value: '804' } });
    fireEvent.blur(externalLengthInput);
    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('products.saveButton'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockUpdateProduct).not.toHaveBeenCalled();

    finishCalculate({
      boxLength: 800,
      boxWidth: null,
      boxHeight: null,
      externalLength: 804,
      externalWidth: null,
      externalHeight: null,
      boxSurface: null,
      boxWeight: null,
      grammage: null,
      effectiveGrammage: 450,
    });

    await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalledTimes(1));
    const payload = mockUpdateProduct.mock.calls[0][1];
    expect(payload.externalLength).toBe(804);
    expect(payload.boxLength).toBe(800);
  });
});

describe('ProductFormModal fefco-sheet-calculation triggers (AC-6)', () => {
  const setup = async () => {
    const { container } = await renderModal();
    await switchTab('production');
    await waitFor(() =>
      expect(container.querySelector('[name="corrugationUuid"] option[value="corr-1"]')).toBeInTheDocument(),
    );
    fireEvent.change(container.querySelector('[name="corrugationUuid"]')!, { target: { value: 'corr-1' } });
    return container;
  };

  it('changing the model select calls calculate once with field: model, value: null and the modelUuid; results land in the inputs', async () => {
    mockGetModels.mockResolvedValue(page([{ uuid: 'model-1', code: 'M-1', description: 'FEFCO 0201' }]));
    const container = await setup();
    await waitFor(() =>
      expect(container.querySelector('[name="modelUuid"] option[value="model-1"]')).toBeInTheDocument(),
    );

    mockCalculate.mockResolvedValue({
      sheetLength: 1860,
      sheetWidth: 1120,
      lowerFlap: 231,
      upperFlap: 203,
      corrugationScoreLines: '202; 305; 203',
      printScoreLines: '30; 405; 505; 405; 505',
      boxSurface: 1.3299,
      boxWeight: 0.598,
      effectiveGrammage: 450,
    });

    fireEvent.change(container.querySelector('[name="modelUuid"]')!, { target: { value: 'model-1' } });

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));
    expect(mockCalculate.mock.calls[0][0]).toMatchObject({
      corrugationUuid: 'corr-1',
      modelUuid: 'model-1',
      field: 'model',
      value: null,
    });

    await waitFor(() =>
      expect((container.querySelector('[name="sheetLength"]') as HTMLInputElement).value).toBe('1860'),
    );
    expect((container.querySelector('[name="sheetWidth"]') as HTMLInputElement).value).toBe('1120');
    expect((container.querySelector('[name="lowerFlap"]') as HTMLInputElement).value).toBe('231');
    expect((container.querySelector('[name="upperFlap"]') as HTMLInputElement).value).toBe('203');
    expect((container.querySelector('[name="corrugationScoreLines"]') as HTMLInputElement).value).toBe(
      '202; 305; 203',
    );
    expect((container.querySelector('[name="printScoreLines"]') as HTMLInputElement).value).toBe(
      '30; 405; 505; 405; 505',
    );
  });

  it('blurring Chapetón (flap) calls calculate once with field: flap', async () => {
    const container = await setup();
    mockCalculate.mockResolvedValue({ lowerFlap: 231, upperFlap: 203 });

    const flapInput = container.querySelector('[name="flap"]') as HTMLInputElement;
    fireEvent.change(flapInput, { target: { value: '35' } });
    fireEvent.blur(flapInput);

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));
    expect(mockCalculate.mock.calls[0][0]).toMatchObject({
      corrugationUuid: 'corr-1',
      field: 'flap',
      value: 35,
    });
  });

  it('toggling mandatory rotation calls calculate once with field: mandatoryRotation', async () => {
    const container = await setup();
    await switchTab('palletizing');
    mockCalculate.mockResolvedValue({ sheetLength: 1120, sheetWidth: 1860 });

    const rotationCheckbox = container.querySelector('[name="mandatoryRotation"]') as HTMLInputElement;
    fireEvent.click(rotationCheckbox);

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));
    expect(mockCalculate.mock.calls[0][0]).toMatchObject({
      corrugationUuid: 'corr-1',
      field: 'mandatoryRotation',
      value: true,
    });
  });

  it('does not call calculate for mandatoryRotation on open/reset of an already-rotated edit product (mutation-check, L-018)', async () => {
    // mandatoryRotation: true + a real corrugationUuid — if the reset/`type`
    // guard regressed, this is exactly the shape that would misfire.
    const rotatedProduct: any = {
      uuid: 'prod-8',
      code: 'CAJA-08',
      revision: 0,
      vip: false,
      symmetricScoreLines: false,
      printCode: false,
      printDate: false,
      printRecyclable: false,
      printWarranty: false,
      printLogo: false,
      printNationalIndustry: false,
      printExport: false,
      allowsRotation: true,
      allowsPartialRotation: true,
      mandatoryRotation: true,
      allowsGluing: false,
      approvalStatus: 'pending',
      customer: { uuid: 'cust-1', name: 'Cliente Uno' },
      corrugation: { uuid: 'corr-1', code: 'C-450' },
    };

    await renderModal({ mode: 'edit', product: rotatedProduct });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it('save carries the model-calculated sheet/flap/score-line values', async () => {
    const container = await setup();
    mockCalculate.mockResolvedValue({
      sheetLength: 1860,
      sheetWidth: 1120,
      lowerFlap: 231,
      upperFlap: 203,
      corrugationScoreLines: '202; 305; 203',
      printScoreLines: '30; 405; 505; 405; 505',
    });
    const flapInput = container.querySelector('[name="flap"]') as HTMLInputElement;
    fireEvent.change(flapInput, { target: { value: '35' } });
    fireEvent.blur(flapInput);
    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((container.querySelector('[name="sheetLength"]') as HTMLInputElement).value).toBe('1860'),
    );

    await switchTab('general');
    fireEvent.change(container.querySelector('[name="code"]')!, { target: { value: 'CAJA-02' } });
    fireEvent.change(container.querySelector('[name="customerId"]')!, { target: { value: 'cust-1' } });
    fireEvent.click(screen.getByText('products.saveButton'));

    await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledTimes(1));
    const payload = mockCreateProduct.mock.calls[0][0];
    expect(payload.sheetLength).toBe(1860);
    expect(payload.sheetWidth).toBe(1120);
    expect(payload.lowerFlap).toBe(231);
    expect(payload.upperFlap).toBe(203);
    expect(payload.corrugationScoreLines).toBe('202; 305; 203');
    expect(payload.printScoreLines).toBe('30; 405; 505; 405; 505');
  });
});

describe('ProductFormModal validation jumps to the offending tab (AC-14)', () => {
  it('switches to tab 2 when corrugationUuid is missing on submit', async () => {
    const { container } = await renderModal();

    fireEvent.change(container.querySelector('[name="code"]')!, { target: { value: 'CAJA-01' } });
    fireEvent.change(container.querySelector('[name="customerId"]')!, { target: { value: 'cust-1' } });

    fireEvent.click(screen.getByText('products.saveButton'));

    await waitFor(() => {
      const productionTab = screen.getByRole('tab', { name: 'products.tabs.production' });
      expect(productionTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });
});
