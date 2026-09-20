import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CreateCustomerModal from '../../components/modals/CreateCustomerModal';

const mockCreateCustomer = jest.fn();
const mockGetCategories = jest.fn();
const mockGetUsers = jest.fn();
const mockGetDeliveryZones = jest.fn();
const mockGetDeliveryLocations = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uuid: 'user-1', role: 'admin' }, isAuthenticated: true, isLoading: false }),
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
  useEffectiveCompany: () => ({ effectiveCompanyId: undefined }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/api', () => ({
  customersApi: {
    createCustomer: (...args: any[]) => mockCreateCustomer(...args),
  },
  customerCategoriesApi: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
  },
  usersApi: {
    getUsers: (...args: any[]) => mockGetUsers(...args),
  },
  deliveryZonesApi: {
    getDeliveryZones: (...args: any[]) => mockGetDeliveryZones(...args),
  },
  deliveryLocationsApi: {
    getDeliveryLocations: (...args: any[]) => mockGetDeliveryLocations(...args),
    createDeliveryLocation: jest.fn(),
    updateDeliveryLocation: jest.fn(),
    deleteDeliveryLocation: jest.fn(),
  },
}));

const page = (data: any[]) => ({ data, total: data.length, page: 1, limit: 100, totalPages: 1 });
const ZONE_A = { uuid: 'zone-a-uuid', code: 'Z-A', description: 'Zone A' };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCategories.mockResolvedValue(page([]));
  mockGetUsers.mockResolvedValue(page([]));
  mockGetDeliveryZones.mockResolvedValue(page([ZONE_A]));
  mockGetDeliveryLocations.mockResolvedValue(page([]));
  mockCreateCustomer.mockResolvedValue({ uuid: 'new-cust-uuid' });
});

describe('CreateCustomerModal — delivery locations at create time', () => {
  it('sends the pending delivery location in the create payload', async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    render(<CreateCustomerModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() => expect(mockGetDeliveryZones).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('common:customerModal.enterCustomerName'), {
      target: { value: 'Acme Corp' },
    });
    fireEvent.change(screen.getByPlaceholderText('common:customerModal.enterAddress'), {
      target: { value: 'Main St 100' },
    });

    fireEvent.click(screen.getByText('common:customerModal.addLocation'));
    fireEvent.change(screen.getByPlaceholderText('common:customerModal.address *'), {
      target: { value: 'Delivery Address 1' },
    });
    const zoneSelect = screen
      .getAllByRole('combobox')
      .find((el) => within(el).queryByText(ZONE_A.code)) as HTMLSelectElement;
    fireEvent.change(zoneSelect, { target: { value: ZONE_A.uuid } });
    fireEvent.click(screen.getByText('common:customerModal.saveLocation'));

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('common:customerModal.address *')).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('common:customerModal.createButton'));

    await waitFor(() => expect(mockCreateCustomer).toHaveBeenCalled());

    expect(mockCreateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Corp',
        address: 'Main St 100',
        deliveryLocations: [
          expect.objectContaining({
            address: 'Delivery Address 1',
            deliveryZoneUuid: ZONE_A.uuid,
          }),
        ],
      })
    );
  });
});
