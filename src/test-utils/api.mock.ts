/**
 * API Mock for Frontend Tests
 * Provides mock implementations of all API services
 */

// Mock data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  uuid: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'member' as const,
  companyId: 'company-uuid-1',
  companyName: 'Test Company',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockAuthUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  uuid: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin' as const,
  companyId: 'company-uuid-1',
  companyName: 'Test Company',
  ...overrides,
});

export const createMockCompany = (overrides: Partial<any> = {}) => ({
  id: 'company-1',
  uuid: 'company-uuid-1',
  name: 'Test Company',
  description: 'A test company',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockInvitation = (overrides: Partial<any> = {}) => ({
  id: 'invitation-1',
  email: 'invited@example.com',
  role: 'member' as const,
  companyId: 'company-uuid-1',
  companyName: 'Test Company',
  inviterName: 'John Doe',
  inviterEmail: 'john@example.com',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  isUsed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCorrugationClass = (overrides: Partial<any> = {}) => ({
  uuid: 'corr-class-uuid-1',
  code: 'CC001',
  description: 'Test Corrugation Class',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCorrugation = (overrides: Partial<any> = {}) => ({
  uuid: 'corr-uuid-1',
  code: 'C001',
  description: 'Test Corrugation',
  theoreticalGrammage: 150,
  suggestedWidth: 1200,
  caliper: 3.5,
  corrugationClass: createMockCorrugationClass(),
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockWarehouse = (overrides: Partial<any> = {}) => ({
  id: 'warehouse-1',
  uuid: 'warehouse-uuid-1',
  name: 'Test Warehouse',
  gridRows: 10,
  gridCols: 20,
  companyId: 'company-uuid-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockManufacturer = (overrides: Partial<any> = {}) => ({
  id: 'manufacturer-1',
  uuid: 'manufacturer-uuid-1',
  code: 'MFG001',
  name: 'Test Manufacturer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockSupplier = (overrides: Partial<any> = {}) => ({
  id: 'supplier-1',
  uuid: 'supplier-uuid-1',
  code: 'SUP001',
  suppliesSheets: true,
  suppliesElaborated: false,
  suppliesConsumables: false,
  suppliesPaper: true,
  suppliesTooling: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockPaperType = (overrides: Partial<any> = {}) => ({
  id: 'paper-type-1',
  uuid: 'paper-type-uuid-1',
  code: 'PT001',
  description: 'Test Paper Type',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockFluteType = (overrides: Partial<any> = {}) => ({
  id: 'flute-type-1',
  uuid: 'flute-type-uuid-1',
  code: 'FT001',
  description: 'Test Flute Type',
  fluteFactor: 1.5,
  length: 100,
  width: 50,
  height: 25,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockPaperClass = (overrides: Partial<any> = {}) => ({
  id: 'paper-class-1',
  uuid: 'paper-class-uuid-1',
  code: 'PC001',
  name: 'Test Paper Class',
  papers: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCustomerCategory = (overrides: Partial<any> = {}) => ({
  id: 'category-1',
  uuid: 'category-uuid-1',
  name: 'Test Category',
  companyId: 'company-uuid-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCustomer = (overrides: Partial<any> = {}) => ({
  id: 'customer-1',
  uuid: 'customer-uuid-1',
  companyId: 'company-uuid-1',
  name: 'Test Customer',
  supplierCode: 'CUST001',
  salesPersonId: 'user-uuid-1',
  salesPersonName: 'John Doe',
  categoryId: 'category-uuid-1',
  categoryName: 'Test Category',
  active: true,
  legalName: 'Test Customer Inc.',
  legalCode: 'TC001',
  address: '123 Test St',
  tradeName: 'Test Trade',
  contacts: [],
  deliveryLocations: [],
  deliveryDays: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockProduct = (overrides: Partial<any> = {}) => ({
  id: 'product-1',
  uuid: 'product-uuid-1',
  code: 'PROD001',
  clientCode: 'CC001',
  description: 'Test Product',
  customerId: 'customer-uuid-1',
  customerName: 'Test Customer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockPaperSupply = (overrides: Partial<any> = {}) => ({
  id: 'paper-supply-1',
  uuid: 'paper-supply-uuid-1',
  code: 'PS001',
  description: 'Test Paper Supply',
  name: 'Test Paper',
  manufacturerId: 'manufacturer-uuid-1',
  manufacturerName: 'Test Manufacturer',
  supplierId: 'supplier-uuid-1',
  supplierCode: 'SUP001',
  minimumStock: { pallets: 10, boxes: 50 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockPaginatedResponse = <T>(data: T[], total?: number) => ({
  data,
  total: total ?? data.length,
  page: 1,
  limit: 10,
  totalPages: Math.ceil((total ?? data.length) / 10),
});

export const createMockLoginResponse = (overrides: Partial<any> = {}) => ({
  token: 'mock-jwt-token',
  user: createMockAuthUser(overrides.user),
  ...overrides,
});

// Mock API implementations - these can be used with jest.mock
export const mockAuthApi = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  changePassword: jest.fn(),
  acceptInvitation: jest.fn(),
  validateInvitation: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
};

export const mockUsersApi = {
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  inviteUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserRole: jest.fn(),
  updateUserStatus: jest.fn(),
  deleteUser: jest.fn(),
  removeUser: jest.fn(),
  getUserStats: jest.fn(),
};

export const mockCompaniesApi = {
  getCompanies: jest.fn(),
  getCompanyById: jest.fn(),
  createCompany: jest.fn(),
  updateCompany: jest.fn(),
  updateCompanyStatus: jest.fn(),
  deleteCompany: jest.fn(),
  getCompanyStats: jest.fn(),
  getCompanyUsers: jest.fn(),
};

export const mockInvitationsApi = {
  getInvitations: jest.fn(),
  createInvitation: jest.fn(),
  getInvitationByToken: jest.fn(),
  resendInvitation: jest.fn(),
  cancelInvitation: jest.fn(),
  getInvitationStats: jest.fn(),
  checkPendingInvitation: jest.fn(),
  cleanupExpired: jest.fn(),
};

export const mockCorrugationClassesApi = {
  getCorrugationClasses: jest.fn(),
  getCorrugationClassById: jest.fn(),
  createCorrugationClass: jest.fn(),
  updateCorrugationClass: jest.fn(),
  deleteCorrugationClass: jest.fn(),
};

export const mockCorrugationsApi = {
  getCorrugations: jest.fn(),
  getCorrugationById: jest.fn(),
  createCorrugation: jest.fn(),
  updateCorrugation: jest.fn(),
  deleteCorrugation: jest.fn(),
};

export const mockWarehousesApi = {
  getWarehouses: jest.fn(),
  getWarehouseById: jest.fn(),
  createWarehouse: jest.fn(),
  updateWarehouse: jest.fn(),
  deleteWarehouse: jest.fn(),
  getWarehouseLocations: jest.fn(),
  batchUpdateLocations: jest.fn(),
};

export const mockManufacturersApi = {
  getManufacturers: jest.fn(),
  getManufacturerById: jest.fn(),
  createManufacturer: jest.fn(),
  updateManufacturer: jest.fn(),
  deleteManufacturer: jest.fn(),
};

export const mockSuppliersApi = {
  getSuppliers: jest.fn(),
  getSupplierById: jest.fn(),
  createSupplier: jest.fn(),
  updateSupplier: jest.fn(),
  deleteSupplier: jest.fn(),
};

export const mockPaperTypesApi = {
  getPaperTypes: jest.fn(),
  getPaperTypeById: jest.fn(),
  createPaperType: jest.fn(),
  updatePaperType: jest.fn(),
  deletePaperType: jest.fn(),
};

export const mockFluteTypesApi = {
  getFluteTypes: jest.fn(),
  getFluteTypeById: jest.fn(),
  createFluteType: jest.fn(),
  updateFluteType: jest.fn(),
  deleteFluteType: jest.fn(),
};

export const mockPaperClassesApi = {
  getPaperClasses: jest.fn(),
  getPaperClassById: jest.fn(),
  createPaperClass: jest.fn(),
  updatePaperClass: jest.fn(),
  deletePaperClass: jest.fn(),
};

export const mockCustomerCategoriesApi = {
  getCategories: jest.fn(),
  getCategoryById: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

export const mockCustomersApi = {
  getCustomers: jest.fn(),
  getCustomerById: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
};

export const mockProductsApi = {
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
};

export const mockPaperSuppliesApi = {
  getPaperSupplies: jest.fn(),
  getPaperSupplyById: jest.fn(),
  createPaperSupply: jest.fn(),
  updatePaperSupply: jest.fn(),
  deletePaperSupply: jest.fn(),
};

// Reset all mocks helper
export const resetAllApiMocks = () => {
  Object.values(mockAuthApi).forEach(mock => mock.mockReset());
  Object.values(mockUsersApi).forEach(mock => mock.mockReset());
  Object.values(mockCompaniesApi).forEach(mock => mock.mockReset());
  Object.values(mockInvitationsApi).forEach(mock => mock.mockReset());
  Object.values(mockCorrugationClassesApi).forEach(mock => mock.mockReset());
  Object.values(mockCorrugationsApi).forEach(mock => mock.mockReset());
  Object.values(mockWarehousesApi).forEach(mock => mock.mockReset());
  Object.values(mockManufacturersApi).forEach(mock => mock.mockReset());
  Object.values(mockSuppliersApi).forEach(mock => mock.mockReset());
  Object.values(mockPaperTypesApi).forEach(mock => mock.mockReset());
  Object.values(mockFluteTypesApi).forEach(mock => mock.mockReset());
  Object.values(mockPaperClassesApi).forEach(mock => mock.mockReset());
  Object.values(mockCustomerCategoriesApi).forEach(mock => mock.mockReset());
  Object.values(mockCustomersApi).forEach(mock => mock.mockReset());
  Object.values(mockProductsApi).forEach(mock => mock.mockReset());
  Object.values(mockPaperSuppliesApi).forEach(mock => mock.mockReset());
};

// Setup default successful responses
export const setupDefaultMocks = () => {
  mockAuthApi.getCurrentUser.mockResolvedValue(createMockAuthUser());
  mockAuthApi.login.mockResolvedValue(createMockLoginResponse());
  mockAuthApi.logout.mockResolvedValue(undefined);

  mockUsersApi.getUsers.mockResolvedValue(createMockPaginatedResponse([createMockUser()]));
  mockUsersApi.getUserById.mockResolvedValue(createMockUser());

  mockCompaniesApi.getCompanies.mockResolvedValue(createMockPaginatedResponse([createMockCompany()]));
  mockCompaniesApi.getCompanyById.mockResolvedValue(createMockCompany());

  mockInvitationsApi.getInvitations.mockResolvedValue(createMockPaginatedResponse([createMockInvitation()]));

  mockCorrugationClassesApi.getCorrugationClasses.mockResolvedValue(createMockPaginatedResponse([createMockCorrugationClass()]));
  mockCorrugationsApi.getCorrugations.mockResolvedValue(createMockPaginatedResponse([createMockCorrugation()]));

  mockWarehousesApi.getWarehouses.mockResolvedValue(createMockPaginatedResponse([createMockWarehouse()]));

  mockManufacturersApi.getManufacturers.mockResolvedValue(createMockPaginatedResponse([createMockManufacturer()]));
  mockSuppliersApi.getSuppliers.mockResolvedValue(createMockPaginatedResponse([createMockSupplier()]));

  mockPaperTypesApi.getPaperTypes.mockResolvedValue(createMockPaginatedResponse([createMockPaperType()]));
  mockFluteTypesApi.getFluteTypes.mockResolvedValue(createMockPaginatedResponse([createMockFluteType()]));
  mockPaperClassesApi.getPaperClasses.mockResolvedValue(createMockPaginatedResponse([createMockPaperClass()]));

  mockCustomerCategoriesApi.getCategories.mockResolvedValue(createMockPaginatedResponse([createMockCustomerCategory()]));
  mockCustomersApi.getCustomers.mockResolvedValue(createMockPaginatedResponse([createMockCustomer()]));
  mockProductsApi.getProducts.mockResolvedValue(createMockPaginatedResponse([createMockProduct()]));

  mockPaperSuppliesApi.getPaperSupplies.mockResolvedValue(createMockPaginatedResponse([createMockPaperSupply()]));
};

// Create mock API error
export const createMockApiError = (message: string, statusCode = 400) => {
  const error: any = new Error(message);
  error.response = {
    status: statusCode,
    data: {
      success: false,
      message,
    },
  };
  return error;
};
