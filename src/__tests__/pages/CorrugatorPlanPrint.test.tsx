import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CorrugatorPlanPrint from '../../pages/CorrugatorPlanPrint';

const mockGetPlan = jest.fn();

jest.mock('../../services/api', () => ({
  corrugatorPlansApi: {
    getPlan: (...args: any[]) => mockGetPlan(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'plan-1' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

const PLAN = {
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
      machineUuid: 'm-1', code: 'COR-01', description: 'Corrugadora 1800', width: 1800, widths: [1800],
      trim: 30, maxElements: 4, tableCount: 2, formatsPerTable: 1, ordersPerFormat: 1, ordersPerTable: 1,
      sheetLengthMin: 500, sheetLengthMax: 3000, maxScoreLines: 0,
    },
  ],
  parameters: {} as any,
  solve: { status: 'ok', startedAt: null, finishedAt: null, combinationsGenerated: 10, log: '' },
  registeredAt: null, registeredByUser: null, createdByUser: 'nacho',
  createdAt: '2026-09-24T09:00:00.000Z', updatedAt: '2026-09-24T10:01:00.000Z',
  orders: [],
  combinations: [
    {
      uuid: 'c-1', machineKey: 'm-1:1800', sequence: 1, meters: 640, width: 1800, trim: 1760,
      transversalRefile: 10, refile: 0.56, fullRefile: 2.22, wasteLinear: 0.02048, scrapKg: 13.1,
      elements: 3, tables: 2, scoreLines: 0,
      items: [
        {
          uuid: 'i-1', position: 0,
          order: { uuid: 'o-1', number: 'OP-2211', customerName: 'Frutas SA', productCode: 'CJ-40' },
          count: 2, rotated: false, runLength: 1180, runWidth: 800,
          plannedSheets: 1085, strokes: 543, linearProduction: 1.6949,
        },
      ],
    },
  ],
  summary: {
    totalMeters: 4120, averageRefile: 1.8, averageFullRefile: 3.4, averageTrim: 1742.6,
    scrapKg: 92.4, complete: 1, partial: 0, empty: 0, exceeded: 0, averageFulfillment: 97.2,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPlan.mockResolvedValue(PLAN);
});

describe('CorrugatorPlanPrint (AC-10)', () => {
  it('renders the plant document grouped by machine, in sequence, with the lanes table', async () => {
    render(<CorrugatorPlanPrint />);

    expect(await screen.findByTestId('print-machine-m-1')).toBeInTheDocument();
    expect(screen.getByTestId('print-combination-c-1')).toBeInTheDocument();
    expect(screen.getByText('OP-2211')).toBeInTheDocument();
    expect(screen.getByText('Frutas SA')).toBeInTheDocument();
    expect(screen.getByTestId('print-totals')).toHaveTextContent('4120');
  });

  it('calls window.print() from the Imprimir button', async () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    render(<CorrugatorPlanPrint />);

    const btn = await screen.findByTestId('print-now-btn');
    fireEvent.click(btn);

    await waitFor(() => expect(printSpy).toHaveBeenCalled());
    printSpy.mockRestore();
  });
});
