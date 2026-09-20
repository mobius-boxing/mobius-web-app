import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeliveryLocationsSection from '../../components/forms/DeliveryLocationsSection';
import { CustomerDeliveryLocationInput } from '../../types';

const mockGetDeliveryZones = jest.fn();
const mockGetDeliveryLocations = jest.fn();
const mockCreateDeliveryLocation = jest.fn();

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/api', () => ({
  deliveryZonesApi: {
    getDeliveryZones: (...args: any[]) => mockGetDeliveryZones(...args),
  },
  deliveryLocationsApi: {
    getDeliveryLocations: (...args: any[]) => mockGetDeliveryLocations(...args),
    createDeliveryLocation: (...args: any[]) => mockCreateDeliveryLocation(...args),
    updateDeliveryLocation: jest.fn(),
    deleteDeliveryLocation: jest.fn(),
  },
}));

const ZONE_A = { uuid: 'zone-a-uuid', code: 'Z-A', description: 'Zone A' };

const page = (data: any[]) => ({ data, total: data.length, page: 1, limit: 100, totalPages: 1 });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDeliveryZones.mockResolvedValue(page([ZONE_A]));
  mockGetDeliveryLocations.mockResolvedValue(page([]));
});

describe('DeliveryLocationsSection — pending mode (customer create)', () => {
  it('adds a location to the pending list without calling the API', async () => {
    const handleChange = jest.fn();
    render(<DeliveryLocationsSection pending={[]} onPendingChange={handleChange} />);

    await waitFor(() => expect(mockGetDeliveryZones).toHaveBeenCalled());
    expect(mockGetDeliveryLocations).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('common:customerModal.addLocation'));

    fireEvent.change(screen.getByPlaceholderText('common:customerModal.address *'), {
      target: { value: 'Av. Siempre Viva 742' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: ZONE_A.uuid } });

    fireEvent.click(screen.getByText('common:customerModal.saveLocation'));

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith([
      { address: 'Av. Siempre Viva 742', schedule: undefined, latitude: undefined, longitude: undefined, externalSystemCode: undefined, deliveryZoneUuid: ZONE_A.uuid },
    ] as CustomerDeliveryLocationInput[]));

    expect(mockCreateDeliveryLocation).not.toHaveBeenCalled();
  });

  it('refuses to save a pending location without a zone', async () => {
    const handleChange = jest.fn();
    render(<DeliveryLocationsSection pending={[]} onPendingChange={handleChange} />);

    await waitFor(() => expect(mockGetDeliveryZones).toHaveBeenCalled());

    fireEvent.click(screen.getByText('common:customerModal.addLocation'));
    fireEvent.change(screen.getByPlaceholderText('common:customerModal.address *'), {
      target: { value: 'Av. Siempre Viva 742' },
    });
    fireEvent.click(screen.getByText('common:customerModal.saveLocation'));

    expect(await screen.findByText('common:customerModal.deliveryZoneRequired')).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
    expect(mockCreateDeliveryLocation).not.toHaveBeenCalled();
  });
});

describe('DeliveryLocationsSection — saved mode (customer edit)', () => {
  it('still calls createDeliveryLocation with the customerUuid', async () => {
    mockCreateDeliveryLocation.mockResolvedValue({});
    render(<DeliveryLocationsSection customerUuid="cust-1-uuid" />);

    await waitFor(() => expect(mockGetDeliveryLocations).toHaveBeenCalled());

    fireEvent.click(screen.getByText('common:customerModal.addLocation'));
    fireEvent.change(screen.getByPlaceholderText('common:customerModal.address *'), {
      target: { value: 'Calle Falsa 123' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: ZONE_A.uuid } });
    fireEvent.click(screen.getByText('common:customerModal.saveLocation'));

    await waitFor(() =>
      expect(mockCreateDeliveryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'Calle Falsa 123', deliveryZoneUuid: ZONE_A.uuid, customerUuid: 'cust-1-uuid' })
      )
    );
  });
});
