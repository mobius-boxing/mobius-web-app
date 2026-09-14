import { CENTRAL_API_FOLDERS, withSelectedCompany } from '../../services/companyScope';

const COMPANY = '37f47cbe-ee49-4d5c-bc46-b3c1a27d3891';
const OTHER = '20fc41e1-0133-478e-8e1c-546b70a28d12';

describe('withSelectedCompany', () => {
  it('adds the selected company to a company-scoped list request', () => {
    const config = withSelectedCompany({ url: '/api/customer', params: { page: 1 } }, COMPANY);
    expect(config.params).toEqual({ page: 1, companyId: COMPANY });
  });

  it('adds it to a detail request by uuid, which carries no params at all', () => {
    const config = withSelectedCompany({ url: `/api/sales-orders/${OTHER}` }, COMPANY);
    expect(config.params).toEqual({ companyId: COMPANY });
  });

  it('adds it to a url that already has its own query string', () => {
    const config = withSelectedCompany({ url: '/api/customer?limit=100' }, COMPANY);
    expect(config.params).toEqual({ companyId: COMPANY });
  });

  it('fills a companyId param that is present but empty', () => {
    expect(
      withSelectedCompany({ url: '/api/roles', params: { companyId: undefined } }, COMPANY).params
    ).toEqual({ companyId: COMPANY });
    expect(
      withSelectedCompany({ url: '/api/roles', params: { companyId: '' } }, COMPANY).params
    ).toEqual({ companyId: COMPANY });
  });

  it('never replaces a company the request already names', () => {
    expect(
      withSelectedCompany({ url: '/api/customer', params: { companyId: OTHER } }, COMPANY).params
    ).toEqual({ companyId: OTHER });
    expect(
      withSelectedCompany({ url: `/api/customer?companyId=${OTHER}` }, COMPANY).params
    ).toBeUndefined();
  });

  it('leaves every central folder alone', () => {
    for (const folder of CENTRAL_API_FOLDERS) {
      expect(withSelectedCompany({ url: `/api/${folder}/x` }, COMPANY).params).toBeUndefined();
    }
    expect(CENTRAL_API_FOLDERS).toEqual(
      expect.arrayContaining(['auth', 'companies', 'users', 'invitations'])
    );
  });

  it('does nothing without a stored selection or outside the API', () => {
    expect(withSelectedCompany({ url: '/api/customer' }, null).params).toBeUndefined();
    expect(withSelectedCompany({ url: '/static/logo.png' }, COMPANY).params).toBeUndefined();
  });
});
