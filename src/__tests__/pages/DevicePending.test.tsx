import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DevicePending from '../../pages/DevicePending';

const mockRequestDevice = jest.fn();
const mockRefreshDevice = jest.fn();
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  useLocation: () => ({ pathname: '/device-pending' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * `requestApproval` (mount effect + retry button + revoked re-request) all
 * funnel through `useAuth().requestDevice` — the one call this suite watches.
 */
const authState = (overrides: Partial<any> = {}) => ({
  user: { role: 'member' },
  device: null,
  deviceBlocked: true,
  refreshDevice: mockRefreshDevice,
  requestDevice: mockRequestDevice,
  logout: mockLogout,
  ...overrides,
});

describe('DevicePending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestDevice.mockResolvedValue(null);
    mockRefreshDevice.mockResolvedValue(undefined);
  });

  it('requests the device once on mount for a member with no device row', async () => {
    mockUseAuth.mockReturnValue(authState());

    render(<DevicePending />);

    await waitFor(() => expect(mockRequestDevice).toHaveBeenCalledTimes(1));
  });

  it('does not request a device for an admin', async () => {
    mockUseAuth.mockReturnValue(
      authState({ user: { role: 'admin' }, deviceBlocked: false })
    );

    render(<DevicePending />);

    // Nothing async to await on the happy path; give any stray microtask a turn.
    await act(async () => {});
    expect(mockRequestDevice).not.toHaveBeenCalled();
  });

  it('does not request a device when one already exists', async () => {
    mockUseAuth.mockReturnValue(
      authState({ device: { uuid: 'd1', status: 'pending', requestedAt: '', approvedAt: null, revokedAt: null } })
    );

    render(<DevicePending />);

    await act(async () => {});
    expect(mockRequestDevice).not.toHaveBeenCalled();
  });

  it('does not retry automatically after the mount call rejects', async () => {
    mockRequestDevice.mockRejectedValueOnce(new Error('network'));
    mockUseAuth.mockReturnValue(authState());

    render(<DevicePending />);

    await waitFor(() => expect(mockRequestDevice).toHaveBeenCalledTimes(1));
    // The rejection resolves into `requesting: false`; no further render or
    // dependency change should trigger a second call.
    await act(async () => {});
    expect(mockRequestDevice).toHaveBeenCalledTimes(1);
  });

  it('disables the retry button while the automatic call is still in flight', async () => {
    let resolveRequest: (value: null) => void = () => {};
    mockRequestDevice.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    mockUseAuth.mockReturnValue(authState());

    render(<DevicePending />);

    await waitFor(() => expect(mockRequestDevice).toHaveBeenCalledTimes(1));
    const button = screen.getByTestId('device-request-approval') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    // A click while the button is disabled must not reach the handler — this is
    // the defect the fix closes: the auto call and a click racing to POST twice.
    fireEvent.click(button);
    expect(mockRequestDevice).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest(null);
    });
    expect(button.disabled).toBe(false);
  });

  it('requests a device once more when the button is clicked on a revoked row', async () => {
    mockUseAuth.mockReturnValue(
      authState({ device: { uuid: 'd1', status: 'revoked', requestedAt: '', approvedAt: null, revokedAt: '' } })
    );

    render(<DevicePending />);

    // A revoked device is not the null-device mount case, so nothing fires yet.
    await act(async () => {});
    expect(mockRequestDevice).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('device-request-approval'));

    await waitFor(() => expect(mockRequestDevice).toHaveBeenCalledTimes(1));
  });

  /**
   * L-018 mutation guard: React.StrictMode mounts, unmounts and remounts effects
   * once in development (jest's NODE_ENV is 'test', which is non-production, so
   * this fires here exactly as it would in `npm start`). A `useRef` guard survives
   * that remount and still calls `requestDevice` exactly once; removing the guard
   * (calling `requestApproval()` unconditionally in the effect body) makes this
   * assertion fail with 2 calls instead of 1 — verified by hand before adding this
   * test, per L-018's requirement to prove a test fails for the right reason.
   */
  it('requests the device only once under StrictMode double-invocation', async () => {
    mockUseAuth.mockReturnValue(authState());

    render(
      <React.StrictMode>
        <DevicePending />
      </React.StrictMode>
    );

    await waitFor(() => expect(mockRequestDevice).toHaveBeenCalledTimes(1));
    // Give a would-be second StrictMode invocation every chance to land before
    // asserting the count is final.
    await act(async () => {});
    expect(mockRequestDevice).toHaveBeenCalledTimes(1);
  });
});
