import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  User,
  Company,
  Invitation,
  CreateCompanyForm,
  InviteUserForm,
  InviteUserRequest,
  UpdateUserRequest,
  AcceptInvitationForm,
  ChangePasswordForm,
  UserStats,
  CompanyStats,
  InvitationStats,
  CustomerCategory,
  Customer,
  CreateCustomerCategoryForm,
  CreateCustomerForm,
  PaperType,
  CreatePaperTypeForm,
  FluteType,
  CreateFluteTypeForm,
  PaperClass,
  CreatePaperClassForm,
  CorrugationClass,
  CreateCorrugationClassForm,
  Corrugation,
  CreateCorrugationForm,
  Product,
  CreateProductForm,
  Manufacturer,
  CreateManufacturerForm,
  Supplier,
  CreateSupplierForm,
  Warehouse,
  CreateWarehouseForm,
  WarehouseLocation,
  BatchUpdateLocation,
  PaperSupply,
  CreatePaperSupplyForm,
  PaperSheet,
  CreatePaperSheetForm,
  PaperStock,
  CreatePaperStockForm,
  SheetStock,
  CreateSheetStockForm,
  WarehouseStockResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/api/auth/login', credentials);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/api/auth/me');
    return response.data.data!;
  },

  changePassword: async (data: ChangePasswordForm): Promise<void> => {
    await api.put('/api/auth/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  acceptInvitation: async (token: string, data: AcceptInvitationForm): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post(`/api/auth/accept-invitation/${token}`, {
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    });
    return response.data.data!;
  },

  validateInvitation: async (token: string): Promise<Invitation> => {
    const response: AxiosResponse<ApiResponse<Invitation>> = await api.get(`/api/auth/invitations/${token}/validate`);
    return response.data.data!;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/api/auth/request-password-reset', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/auth/reset-password', { token, newPassword });
  },
};

// Users API
export const usersApi = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/api/users', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/api/users/${id}`);
    return response.data.data!;
  },

  inviteUser: async (data: InviteUserForm): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/api/users/invite', data);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}`, data);
    return response.data.data!;
  },

  updateUserRole: async (id: string, role: 'member' | 'admin'): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}/role`, { role });
    return response.data.data!;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}/status`, { isActive });
    return response.data.data!;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  removeUser: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  getUserStats: async (companyId?: string): Promise<UserStats> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<UserStats>> = await api.get('/api/users/stats', { params });
    return response.data.data!;
  },
};

// Companies API
export const companiesApi = {
  getCompanies: async (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<Company>> => {
    const response = await api.get('/api/companies', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.get(`/api/companies/${id}`);
    return response.data.data!;
  },

  createCompany: async (data: CreateCompanyForm): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.post('/api/companies', data);
    return response.data.data!;
  },

  updateCompany: async (id: string, data: Partial<CreateCompanyForm>): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.put(`/api/companies/${id}`, data);
    return response.data.data!;
  },

  updateCompanyStatus: async (id: string, isActive: boolean): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.put(`/api/companies/${id}/status`, { isActive });
    return response.data.data!;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/api/companies/${id}`);
  },

  getCompanyStats: async (): Promise<CompanyStats> => {
    const response: AxiosResponse<ApiResponse<CompanyStats>> = await api.get('/api/companies/stats');
    return response.data.data!;
  },

  getCompanyUsers: async (id: string, params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get(`/api/companies/${id}/users`, { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },
};

// Invitations API
export const invitationsApi = {
  getInvitations: async (params: {
    page?: number;
    limit?: number;
    isUsed?: boolean;
    includeExpired?: boolean;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Invitation>> => {
    const response = await api.get('/api/invitations', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createInvitation: async (data: InviteUserRequest): Promise<Invitation> => {
    const response: AxiosResponse<ApiResponse<Invitation>> = await api.post('/api/users/invite', data);
    return response.data.data!;
  },

  getInvitationByToken: async (token: string): Promise<Invitation> => {
    const response: AxiosResponse<ApiResponse<Invitation>> = await api.get(`/api/invitations/${token}`);
    return response.data.data!;
  },

  resendInvitation: async (id: string): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/api/invitations/${id}/resend`);
    return response.data.data;
  },

  cancelInvitation: async (id: string): Promise<void> => {
    await api.delete(`/api/invitations/${id}`);
  },

  getInvitationStats: async (companyId?: string): Promise<InvitationStats> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<InvitationStats>> = await api.get('/api/invitations/stats', { params });
    return response.data.data!;
  },

  checkPendingInvitation: async (email: string): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/api/invitations/check/${email}`);
    return response.data.data;
  },

  cleanupExpired: async (): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/api/invitations/cleanup');
    return response.data.data;
  },
};

// Customer Categories API
export const customerCategoriesApi = {
  getCategories: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<CustomerCategory>> => {
    const response = await api.get('/api/customer-category', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCategoryById: async (id: string): Promise<CustomerCategory> => {
    const response: AxiosResponse<ApiResponse<CustomerCategory>> = await api.get(`/api/customer-category/${id}`);
    return response.data.data!;
  },

  createCategory: async (data: CreateCustomerCategoryForm): Promise<CustomerCategory> => {
    const response: AxiosResponse<ApiResponse<CustomerCategory>> = await api.post('/api/customer-category', data);
    return response.data.data!;
  },

  updateCategory: async (id: string, data: Partial<CreateCustomerCategoryForm>): Promise<CustomerCategory> => {
    const response: AxiosResponse<ApiResponse<CustomerCategory>> = await api.put(`/api/customer-category/${id}`, data);
    return response.data.data!;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/api/customer-category/${id}`);
  },
};

// Customers API
export const customersApi = {
  getCustomers: async (params: {
    page?: number;
    limit?: number;
    active?: boolean;
    categoryId?: string;
    salesPersonId?: string;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get('/api/customer', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.get(`/api/customer/${id}`);
    return response.data.data!;
  },

  createCustomer: async (data: CreateCustomerForm): Promise<Customer> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.post('/api/customer', data);
    return response.data.data!;
  },

  updateCustomer: async (id: string, data: Partial<CreateCustomerForm>): Promise<Customer> => {
    const response: AxiosResponse<ApiResponse<Customer>> = await api.put(`/api/customer/${id}`, data);
    return response.data.data!;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/api/customer/${id}`);
  },
};

// Paper Types API
export const paperTypesApi = {
  getPaperTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<PaperType>> => {
    const response = await api.get('/api/paper-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getPaperTypeById: async (id: string): Promise<PaperType> => {
    const response: AxiosResponse<ApiResponse<PaperType>> = await api.get(`/api/paper-type/${id}`);
    return response.data.data!;
  },

  createPaperType: async (data: CreatePaperTypeForm): Promise<PaperType> => {
    const response: AxiosResponse<ApiResponse<PaperType>> = await api.post('/api/paper-type', data);
    return response.data.data!;
  },

  updatePaperType: async (id: string, data: Partial<CreatePaperTypeForm>): Promise<PaperType> => {
    const response: AxiosResponse<ApiResponse<PaperType>> = await api.put(`/api/paper-type/${id}`, data);
    return response.data.data!;
  },

  deletePaperType: async (id: string): Promise<void> => {
    await api.delete(`/api/paper-type/${id}`);
  },
};

// Flute Types API
export const fluteTypesApi = {
  getFluteTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<FluteType>> => {
    const response = await api.get('/api/flute-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getFluteTypeById: async (id: string): Promise<FluteType> => {
    const response: AxiosResponse<ApiResponse<FluteType>> = await api.get(`/api/flute-type/${id}`);
    return response.data.data!;
  },

  createFluteType: async (data: CreateFluteTypeForm): Promise<FluteType> => {
    const response: AxiosResponse<ApiResponse<FluteType>> = await api.post('/api/flute-type', data);
    return response.data.data!;
  },

  updateFluteType: async (id: string, data: Partial<CreateFluteTypeForm>): Promise<FluteType> => {
    const response: AxiosResponse<ApiResponse<FluteType>> = await api.put(`/api/flute-type/${id}`, data);
    return response.data.data!;
  },

  deleteFluteType: async (id: string): Promise<void> => {
    await api.delete(`/api/flute-type/${id}`);
  },
};

// Paper Classes API
export const paperClassesApi = {
  getPaperClasses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<PaperClass>> => {
    const response = await api.get('/api/paper-class', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getPaperClassById: async (id: string): Promise<PaperClass> => {
    const response: AxiosResponse<ApiResponse<PaperClass>> = await api.get(`/api/paper-class/${id}`);
    return response.data.data!;
  },

  createPaperClass: async (data: CreatePaperClassForm): Promise<PaperClass> => {
    const response: AxiosResponse<ApiResponse<PaperClass>> = await api.post('/api/paper-class', data);
    return response.data.data!;
  },

  updatePaperClass: async (id: string, data: Partial<CreatePaperClassForm>): Promise<PaperClass> => {
    const response: AxiosResponse<ApiResponse<PaperClass>> = await api.put(`/api/paper-class/${id}`, data);
    return response.data.data!;
  },

  deletePaperClass: async (id: string): Promise<void> => {
    await api.delete(`/api/paper-class/${id}`);
  },
};

// Corrugation Classes API
export const corrugationClassesApi = {
  getCorrugationClasses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<CorrugationClass>> => {
    const response = await api.get('/api/corrugation-class', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCorrugationClassById: async (id: string): Promise<CorrugationClass> => {
    const response: AxiosResponse<ApiResponse<CorrugationClass>> = await api.get(`/api/corrugation-class/${id}`);
    return response.data.data!;
  },

  createCorrugationClass: async (data: CreateCorrugationClassForm): Promise<CorrugationClass> => {
    const response: AxiosResponse<ApiResponse<CorrugationClass>> = await api.post('/api/corrugation-class', data);
    return response.data.data!;
  },

  updateCorrugationClass: async (id: string, data: Partial<CreateCorrugationClassForm>): Promise<CorrugationClass> => {
    const response: AxiosResponse<ApiResponse<CorrugationClass>> = await api.put(`/api/corrugation-class/${id}`, data);
    return response.data.data!;
  },

  deleteCorrugationClass: async (id: string): Promise<void> => {
    await api.delete(`/api/corrugation-class/${id}`);
  },
};

// Corrugations API
export const corrugationsApi = {
  getCorrugations: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Corrugation>> => {
    const response = await api.get('/api/corrugation', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCorrugationById: async (id: string): Promise<Corrugation> => {
    const response: AxiosResponse<ApiResponse<Corrugation>> = await api.get(`/api/corrugation/${id}`);
    return response.data.data!;
  },

  createCorrugation: async (data: CreateCorrugationForm): Promise<Corrugation> => {
    const response: AxiosResponse<ApiResponse<Corrugation>> = await api.post('/api/corrugation', data);
    return response.data.data!;
  },

  updateCorrugation: async (id: string, data: Partial<CreateCorrugationForm>): Promise<Corrugation> => {
    const response: AxiosResponse<ApiResponse<Corrugation>> = await api.put(`/api/corrugation/${id}`, data);
    return response.data.data!;
  },

  deleteCorrugation: async (id: string): Promise<void> => {
    await api.delete(`/api/corrugation/${id}`);
  },
};

// Products API
export const productsApi = {
  getProducts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
  } = {}): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/api/product', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getProductById: async (id: string): Promise<Product> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.get(`/api/product/${id}`);
    return response.data.data!;
  },

  createProduct: async (data: CreateProductForm): Promise<Product> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.post('/api/product', data);
    return response.data.data!;
  },

  updateProduct: async (id: string, data: Partial<CreateProductForm>): Promise<Product> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.put(`/api/product/${id}`, data);
    return response.data.data!;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/api/product/${id}`);
  },
};

// Manufacturers API
export const manufacturersApi = {
  getManufacturers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Manufacturer>> => {
    const response = await api.get('/api/manufacturer', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getManufacturerById: async (id: string): Promise<Manufacturer> => {
    const response: AxiosResponse<ApiResponse<Manufacturer>> = await api.get(`/api/manufacturer/${id}`);
    return response.data.data!;
  },

  createManufacturer: async (data: CreateManufacturerForm): Promise<Manufacturer> => {
    const response: AxiosResponse<ApiResponse<Manufacturer>> = await api.post('/api/manufacturer', data);
    return response.data.data!;
  },

  updateManufacturer: async (id: string, data: Partial<CreateManufacturerForm>): Promise<Manufacturer> => {
    const response: AxiosResponse<ApiResponse<Manufacturer>> = await api.put(`/api/manufacturer/${id}`, data);
    return response.data.data!;
  },

  deleteManufacturer: async (id: string): Promise<void> => {
    await api.delete(`/api/manufacturer/${id}`);
  },
};

// Suppliers API
export const suppliersApi = {
  getSuppliers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get('/api/supplier', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response: AxiosResponse<ApiResponse<Supplier>> = await api.get(`/api/supplier/${id}`);
    return response.data.data!;
  },

  createSupplier: async (data: CreateSupplierForm): Promise<Supplier> => {
    const response: AxiosResponse<ApiResponse<Supplier>> = await api.post('/api/supplier', data);
    return response.data.data!;
  },

  updateSupplier: async (id: string, data: Partial<CreateSupplierForm>): Promise<Supplier> => {
    const response: AxiosResponse<ApiResponse<Supplier>> = await api.put(`/api/supplier/${id}`, data);
    return response.data.data!;
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/api/supplier/${id}`);
  },
};

// Warehouses API
export const warehousesApi = {
  getWarehouses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Warehouse>> => {
    const response = await api.get('/api/warehouse', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response: AxiosResponse<ApiResponse<Warehouse>> = await api.get(`/api/warehouse/${id}`);
    return response.data.data!;
  },

  createWarehouse: async (data: CreateWarehouseForm): Promise<Warehouse> => {
    const response: AxiosResponse<ApiResponse<Warehouse>> = await api.post('/api/warehouse', data);
    return response.data.data!;
  },

  updateWarehouse: async (id: string, data: Partial<CreateWarehouseForm>): Promise<Warehouse> => {
    const response: AxiosResponse<ApiResponse<Warehouse>> = await api.put(`/api/warehouse/${id}`, data);
    return response.data.data!;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await api.delete(`/api/warehouse/${id}`);
  },

  // Warehouse Locations API
  getWarehouseLocations: async (warehouseUuid: string): Promise<WarehouseLocation[]> => {
    const response: AxiosResponse<ApiResponse<WarehouseLocation[]>> = await api.get(`/api/warehouseLocation/warehouse/${warehouseUuid}`);
    return response.data.data!;
  },

  batchUpdateLocations: async (warehouseUuid: string, locations: BatchUpdateLocation[]): Promise<WarehouseLocation[]> => {
    const response: AxiosResponse<ApiResponse<WarehouseLocation[]>> = await api.put(`/api/warehouseLocation/warehouse/${warehouseUuid}/batch`, {
      locations,
    });
    return response.data.data!;
  },

  getWarehouseStock: async (warehouseUuid: string): Promise<WarehouseStockResponse> => {
    const response: AxiosResponse<ApiResponse<WarehouseStockResponse>> = await api.get(`/api/warehouse/${warehouseUuid}/stock`);
    return response.data.data!;
  },
};

// Paper Supplies API
export const paperSuppliesApi = {
  getPaperSupplies: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    manufacturerId?: string;
    supplierId?: string;
    paperTypeId?: string;
  } = {}): Promise<PaginatedResponse<PaperSupply>> => {
    const response = await api.get('/api/paper-supply', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getPaperSupplyById: async (id: string): Promise<PaperSupply> => {
    const response: AxiosResponse<ApiResponse<PaperSupply>> = await api.get(`/api/paper-supply/${id}`);
    return response.data.data!;
  },

  createPaperSupply: async (data: CreatePaperSupplyForm): Promise<PaperSupply> => {
    const response: AxiosResponse<ApiResponse<PaperSupply>> = await api.post('/api/paper-supply', data);
    return response.data.data!;
  },

  updatePaperSupply: async (id: string, data: Partial<CreatePaperSupplyForm>): Promise<PaperSupply> => {
    const response: AxiosResponse<ApiResponse<PaperSupply>> = await api.put(`/api/paper-supply/${id}`, data);
    return response.data.data!;
  },

  deletePaperSupply: async (id: string): Promise<void> => {
    await api.delete(`/api/paper-supply/${id}`);
  },
};

// Paper Sheets API
export const paperSheetsApi = {
  getPaperSheets: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    supplierId?: string;
    manufacturerId?: string;
    corrugationId?: string;
  } = {}): Promise<PaginatedResponse<PaperSheet>> => {
    const response = await api.get('/api/paper-sheet', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getPaperSheetById: async (id: string): Promise<PaperSheet> => {
    const response: AxiosResponse<ApiResponse<PaperSheet>> = await api.get(`/api/paper-sheet/${id}`);
    return response.data.data!;
  },

  createPaperSheet: async (data: CreatePaperSheetForm): Promise<PaperSheet> => {
    const response: AxiosResponse<ApiResponse<PaperSheet>> = await api.post('/api/paper-sheet', data);
    return response.data.data!;
  },

  updatePaperSheet: async (id: string, data: Partial<CreatePaperSheetForm>): Promise<PaperSheet> => {
    const response: AxiosResponse<ApiResponse<PaperSheet>> = await api.put(`/api/paper-sheet/${id}`, data);
    return response.data.data!;
  },

  deletePaperSheet: async (id: string): Promise<void> => {
    await api.delete(`/api/paper-sheet/${id}`);
  },
};

// Paper Stock API
export const paperStockApi = {
  getPaperStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    paperSupplyId?: string;
  } = {}): Promise<PaginatedResponse<PaperStock>> => {
    const response = await api.get('/api/paper-stock', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getPaperStockById: async (id: string): Promise<PaperStock> => {
    const response: AxiosResponse<ApiResponse<PaperStock>> = await api.get(`/api/paper-stock/${id}`);
    return response.data.data!;
  },

  createPaperStock: async (data: CreatePaperStockForm): Promise<PaperStock> => {
    const response: AxiosResponse<ApiResponse<PaperStock>> = await api.post('/api/paper-stock', data);
    return response.data.data!;
  },

  updatePaperStock: async (id: string, data: Partial<CreatePaperStockForm>): Promise<PaperStock> => {
    const response: AxiosResponse<ApiResponse<PaperStock>> = await api.put(`/api/paper-stock/${id}`, data);
    return response.data.data!;
  },

  deletePaperStock: async (id: string): Promise<void> => {
    await api.delete(`/api/paper-stock/${id}`);
  },
};

// Sheet Stock API
export const sheetStockApi = {
  getSheetStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    paperSheetId?: string;
  } = {}): Promise<PaginatedResponse<SheetStock>> => {
    const response = await api.get('/api/sheet-stock', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getSheetStockById: async (id: string): Promise<SheetStock> => {
    const response: AxiosResponse<ApiResponse<SheetStock>> = await api.get(`/api/sheet-stock/${id}`);
    return response.data.data!;
  },

  createSheetStock: async (data: CreateSheetStockForm): Promise<SheetStock> => {
    const response: AxiosResponse<ApiResponse<SheetStock>> = await api.post('/api/sheet-stock', data);
    return response.data.data!;
  },

  updateSheetStock: async (id: string, data: Partial<CreateSheetStockForm>): Promise<SheetStock> => {
    const response: AxiosResponse<ApiResponse<SheetStock>> = await api.put(`/api/sheet-stock/${id}`, data);
    return response.data.data!;
  },

  deleteSheetStock: async (id: string): Promise<void> => {
    await api.delete(`/api/sheet-stock/${id}`);
  },
};

export default api;