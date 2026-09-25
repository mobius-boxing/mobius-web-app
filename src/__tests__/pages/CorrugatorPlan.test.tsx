import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CorrugatorPlan from '../../pages/CorrugatorPlan';

const mockGetPlan = jest.fn();
const mockRegister = jest.fn();
const mockSolve = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../services/api', () => ({
  corrugatorPlansApi: {
    getPlan: (...args: any[]) => mockGetPlan(...args),
    solve: (...args: any[]) => mockSolve(...args),
    cancelSolve: jest.fn(),
    register: (...args: any[]) => mockRegister(...args),
    unregister: jest.fn(),
    updatePlan: jest.fn(),
    updateOrder: jest.fn(),
    removeOrder: jest.fn(),
    setCombinationMeters: jest.fn(),
    setCombinationSequence: jest.fn(),
    setCombinationMachineKey: jest.fn(),
    setItemPlannedSheets: jest.fn(),
    deleteCombination: jest.fn(),
    deleteItem: jest.fn(),
    getCandidates: jest.fn(),
    getPool: jest.fn(),
    deletePlan: jest.fn(),
  },
  machinesApi: {
    getMachines: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 1 }),
  },
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'plan-1' }),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin', permissions: ['corrugator.plan', 'corrugator.register'] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
  useEffectiveCompany: () => ({ effectiveCompanyId: undefined }),
}));

const SOLVED_PLAN = {
  uuid: 'plan-1',
  number: 12,
  name: 'Onda C — semana 40',
  notes: null,
  status: 'solved',
  board: {
    key: '1:L:KL:-',
    corrugations: [{ uuid: 'c-1', code: 'C-512' }],
    fluteTypes: ['C'],
    paperClasses: [{ code: 'KL', name: 'Kraft liner' }],
    theoreticalGrammage: 512,
  },
  machines: [
    {
      machineUuid: 'm-1',
      code: 'COR-01',
      description: 'Corrugadora 1800',
      width: 1800,
      widths: [1800, 1650],
      trim: 30,
      maxElements: 4,
      tableCount: 2,
      formatsPerTable: 1,
      ordersPerFormat: 1,
      ordersPerTable: 1,
      sheetLengthMin: 500,
      sheetLengthMax: 3000,
      maxScoreLines: 0,
    },
  ],
  parameters: {
    scrapAbsolute: 80, scrapPercentage: 100, excessFactor: 0, toleranceQuantities: true, rotation: true,
    minRunLength: 500, minMeters: 0, minFormatLength: 0, limitCombinations: 0,
    costViolationLower: 10, costViolationUpper: 100, costViolationLowerMandatory: 100, costViolationUpperMandatory: 1000,
    costFormatChange: 5, averageGrammage: 0, roundingFactor: 0, maxGap: 10, timeLimitSeconds: 120,
    constraints: { violationLower: true, violationUpper: false, minRun: true, conditionalProduction: false, minFormat: false },
  },
  solve: { status: 'ok', startedAt: '2026-09-24T10:00:00.000Z', finishedAt: '2026-09-24T10:01:00.000Z', combinationsGenerated: 1834, log: '' },
  registeredAt: null,
  registeredByUser: null,
  createdByUser: 'nacho',
  createdAt: '2026-09-24T09:00:00.000Z',
  updatedAt: '2026-09-24T10:01:00.000Z',
  orders: [
    {
      uuid: 'o-1',
      position: 0,
      productionOrder: { uuid: 'po-1', number: 'OP-2211' },
      customerName: 'Frutas SA',
      productCode: 'CJ-40',
      productDescription: 'Caja 40x30',
      deliveryDate: '2026-10-02T00:00:00.000Z',
      sheetLength: 1180,
      sheetWidth: 800,
      allowsRotation: true,
      scoreLineCount: 0,
      orderQuantity: 5000,
      sheetsPerUnit: 1,
      sheetsSource: 'route',
      requiredSheets: 5000,
      pendingSheets: 5000,
      requestedSheets: 5000,
      underrunPercentage: 2,
      overrunPercentage: 5,
      priority: 'normal',
      partialProduction: true,
      allocatedSheets: null,
      lowerBound: 4900,
      upperBound: 5250,
      plannedSheets: 5085,
      fulfillment: 101.7,
      state: 'complete',
    },
  ],
  combinations: [
    {
      uuid: 'c-1',
      machineKey: 'm-1:1800',
      sequence: 1,
      meters: 640,
      width: 1800,
      trim: 1760,
      transversalRefile: 10,
      refile: 0.56,
      fullRefile: 2.22,
      wasteLinear: 0.02048,
      scrapKg: 13.1,
      elements: 3,
      tables: 2,
      scoreLines: 0,
      items: [
        {
          uuid: 'i-1',
          position: 0,
          order: { uuid: 'o-1', number: 'OP-2211', customerName: 'Frutas SA', productCode: 'CJ-40' },
          count: 2,
          rotated: false,
          runLength: 1180,
          runWidth: 800,
          plannedSheets: 1085,
          strokes: 543,
          linearProduction: 1.6949,
        },
      ],
    },
  ],
  summary: {
    totalMeters: 4120, averageRefile: 1.8, averageFullRefile: 3.4, averageTrim: 1742.6,
    scrapKg: 92.4, complete: 4, partial: 1, empty: 0, exceeded: 0, averageFulfillment: 97.2,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPlan.mockResolvedValue(SOLVED_PLAN);
});

describe('CorrugatorPlan editor (AC-10)', () => {
  it('renders the solved plan: status pill, KPI strip and per-order fulfilment table', async () => {
    render(<CorrugatorPlan />);

    expect(await screen.findByTestId('plan-status-pill')).toHaveTextContent('corrugatorPlans.status.solved');
    expect(screen.getByTestId('kpi-strip')).toBeInTheDocument();
    expect(screen.getByTestId('fulfillment-o-1')).toBeInTheDocument();
    expect(screen.getAllByText('OP-2211').length).toBeGreaterThan(0);
  });

  it('renders a lane diagram per combination with one segment per lane', async () => {
    render(<CorrugatorPlan />);

    const diagram = await screen.findByTestId('lane-diagram-c-1');
    expect(diagram).toBeInTheDocument();
    expect(diagram.querySelectorAll('[data-testid="lane-segment"]')).toHaveLength(1);
  });

  it('shows the "Generar Programa de Corrugado" action for a solved plan and registers on click', async () => {
    mockRegister.mockResolvedValue({ ...SOLVED_PLAN, status: 'registered', registeredAt: '2026-09-25T00:00:00.000Z' });
    render(<CorrugatorPlan />);

    const registerBtn = await screen.findByTestId('register-btn');
    fireEvent.click(registerBtn);

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('plan-1', false));
    expect(await screen.findByTestId('unregister-btn')).toBeInTheDocument();
  });

  it('shows the STALE_PENDING conflict with a Forzar action when register is rejected', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { code: 'STALE_PENDING', message: 'Pendiente desactualizado', orders: [{ uuid: 'po-1', number: 'OP-2211', pendingSheets: 5000, pendingNow: 4800 }] } },
    });
    render(<CorrugatorPlan />);

    fireEvent.click(await screen.findByTestId('register-btn'));

    expect(await screen.findByTestId('register-conflict')).toHaveTextContent('Pendiente desactualizado');
    expect(screen.getByTestId('register-force-btn')).toBeInTheDocument();
  });

  it('offers a reel-width select per combination (D-44) that moves it to another (machine, width) pair', async () => {
    render(<CorrugatorPlan />);

    const select = await screen.findByTestId('combination-machine-key-c-1');
    expect(select).toHaveValue('m-1:1800');
    fireEvent.change(select, { target: { value: 'm-1:1650' } });

    await waitFor(() =>
      expect(require('../../services/api').corrugatorPlansApi.setCombinationMachineKey).toHaveBeenCalledWith('plan-1', 'c-1', 'm-1:1650'),
    );
  });

  // The plan line ('o-1') and its production order ('po-1') have different uuids; the
  // line endpoints and candidates take the LINE uuid (the browser run once caught a 400 here).
  it('asks for candidates with the plan line uuid, not the production order uuid', async () => {
    const api = require('../../services/api').corrugatorPlansApi;
    api.getCandidates.mockResolvedValue([]);
    render(<CorrugatorPlan />);

    fireEvent.click(await screen.findByTestId('add-combination-for-o-1'));

    await waitFor(() => expect(api.getCandidates).toHaveBeenCalledWith('plan-1', 'o-1'));
  });

  it('edits a line through the plan line uuid', async () => {
    const api = require('../../services/api').corrugatorPlansApi;
    api.updateOrder.mockResolvedValue(SOLVED_PLAN.orders[0]);
    render(<CorrugatorPlan />);

    const input = await screen.findByTestId('order-requested-sheets-o-1');
    fireEvent.change(input, { target: { value: '4000' } });
    fireEvent.blur(input);
    const confirm = screen.queryByRole('button', { name: /confirm/i });
    if (confirm) fireEvent.click(confirm);

    await waitFor(() => expect(api.updateOrder).toHaveBeenCalledWith('plan-1', 'o-1', expect.anything()));
  });
});
