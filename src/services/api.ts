import axios, { AxiosResponse } from 'axios';
import { getToken, clearToken } from '../utils/session';
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
  FlapType,
  CreateFlapTypeForm,
  ProductType,
  CreateProductTypeForm,
  BoxType,
  CreateBoxTypeForm,
  PaperClass,
  CreatePaperClassForm,
  CorrugationClass,
  CreateCorrugationClassForm,
  Corrugation,
  CreateCorrugationForm,
  DeliveryZone,
  CreateDeliveryZoneForm,
  DeliveryLocationRecord,
  CreateDeliveryLocationForm,
  FinishedGood,
  CreateFinishedGoodForm,
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
  WarehouseStockResponse,
  ToolingType,
  CreateToolingTypeForm,
  Tooling,
  CreateToolingForm,
  ConsumableType,
  CreateConsumableTypeForm,
  ConsumableSupply,
  CreateConsumableSupplyForm,
  ToolingStock,
  CreateToolingStockForm,
  ConsumableStock,
  CreateConsumableStockForm,
  GlueType,
  ColorType,
  CreateColorTypeForm,
  Color,
  CreateColorForm,
  FscType,
  CreateFscTypeForm,
  CreateGlueTypeForm,
  StrappingType,
  CreateStrappingTypeForm,
  Complement,
  CreateComplementForm,
  TraceType,
  CreateTraceTypeForm,
  Role,
  CreateRoleForm,
  Permission,
  FileRecord,
  PalletType,
  CreatePalletTypeForm,
  Palletization,
  MachineType,
  CreateMachineTypeForm,
  Machine,
  CreateMachineForm,
  ProductionRoute,
  Part,
  PartFormPayload,
  PartApprovalMachine,
  RouteStage,
  CreatePalletizationForm,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from these endpoints is an expected response the calling component renders inline
// (bad credentials, wrong current password, invalid/expired reset token), NOT a stale
// session. Only a 401 from another (token-authenticated) request means the session expired,
// which is what should clear local auth and bounce to the login page.
const SELF_HANDLED_401_PATHS = [
  '/api/auth/login',
  '/api/auth/password',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || '';
    const isSelfHandled = SELF_HANDLED_401_PATHS.some((path) => url.includes(path));
    if (error.response?.status === 401 && !isSelfHandled) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/api/auth/login', credentials);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    clearToken();
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

export const usersApi = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
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

export const companiesApi = {
  getCompanies: async (params: {
    page?: number;
    limit?: number;
    search?: string;
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

export const invitationsApi = {
  getInvitations: async (params: {
    page?: number;
    limit?: number;
    search?: string;
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

export const paperTypesApi = {
  getPaperTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const fluteTypesApi = {
  getFluteTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const flapTypesApi = {
  getFlapTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<FlapType>> => {
    const response = await api.get('/api/flap-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getFlapTypeById: async (id: string): Promise<FlapType> => {
    const response: AxiosResponse<ApiResponse<FlapType>> = await api.get(`/api/flap-type/${id}`);
    return response.data.data!;
  },

  createFlapType: async (data: CreateFlapTypeForm): Promise<FlapType> => {
    const response: AxiosResponse<ApiResponse<FlapType>> = await api.post('/api/flap-type', data);
    return response.data.data!;
  },

  updateFlapType: async (id: string, data: Partial<CreateFlapTypeForm>): Promise<FlapType> => {
    const response: AxiosResponse<ApiResponse<FlapType>> = await api.put(`/api/flap-type/${id}`, data);
    return response.data.data!;
  },

  deleteFlapType: async (id: string): Promise<void> => {
    await api.delete(`/api/flap-type/${id}`);
  },
};

export const productTypesApi = {
  getProductTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<ProductType>> => {
    const response = await api.get('/api/product-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getProductTypeById: async (id: string): Promise<ProductType> => {
    const response: AxiosResponse<ApiResponse<ProductType>> = await api.get(`/api/product-type/${id}`);
    return response.data.data!;
  },

  createProductType: async (data: CreateProductTypeForm): Promise<ProductType> => {
    const response: AxiosResponse<ApiResponse<ProductType>> = await api.post('/api/product-type', data);
    return response.data.data!;
  },

  updateProductType: async (id: string, data: Partial<CreateProductTypeForm>): Promise<ProductType> => {
    const response: AxiosResponse<ApiResponse<ProductType>> = await api.put(`/api/product-type/${id}`, data);
    return response.data.data!;
  },

  deleteProductType: async (id: string): Promise<void> => {
    await api.delete(`/api/product-type/${id}`);
  },
};

export const boxTypesApi = {
  getBoxTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<BoxType>> => {
    const response = await api.get('/api/box-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getBoxTypeById: async (id: string): Promise<BoxType> => {
    const response: AxiosResponse<ApiResponse<BoxType>> = await api.get(`/api/box-type/${id}`);
    return response.data.data!;
  },

  createBoxType: async (data: CreateBoxTypeForm): Promise<BoxType> => {
    const response: AxiosResponse<ApiResponse<BoxType>> = await api.post('/api/box-type', data);
    return response.data.data!;
  },

  updateBoxType: async (id: string, data: Partial<CreateBoxTypeForm>): Promise<BoxType> => {
    const response: AxiosResponse<ApiResponse<BoxType>> = await api.put(`/api/box-type/${id}`, data);
    return response.data.data!;
  },

  deleteBoxType: async (id: string): Promise<void> => {
    await api.delete(`/api/box-type/${id}`);
  },
};

export const paperClassesApi = {
  getPaperClasses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const corrugationClassesApi = {
  getCorrugationClasses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const corrugationsApi = {
  getCorrugations: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const productsApi = {
  setApproval: async (uuid: string, action: 'approve' | 'cancel'): Promise<Product> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.patch(`/api/product/${uuid}/approval`, { action });
    return response.data.data!;
  },

  getProducts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    companyId?: string;
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

export const manufacturersApi = {
  getManufacturers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const suppliersApi = {
  getSuppliers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
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

export const deliveryZonesApi = {
  getDeliveryZones: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<DeliveryZone>> => {
    const response = await api.get('/api/delivery-zones', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createDeliveryZone: async (data: CreateDeliveryZoneForm): Promise<DeliveryZone> => {
    const response: AxiosResponse<ApiResponse<DeliveryZone>> = await api.post('/api/delivery-zones', data);
    return response.data.data!;
  },

  updateDeliveryZone: async (uuid: string, data: Partial<CreateDeliveryZoneForm>): Promise<DeliveryZone> => {
    const response: AxiosResponse<ApiResponse<DeliveryZone>> = await api.put(`/api/delivery-zones/${uuid}`, data);
    return response.data.data!;
  },

  deleteDeliveryZone: async (uuid: string): Promise<void> => {
    await api.delete(`/api/delivery-zones/${uuid}`);
  },
};

export const deliveryLocationsApi = {
  getDeliveryLocations: async (params: {
    page?: number;
    limit?: number;
    customerUuid?: string;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<DeliveryLocationRecord>> => {
    const response = await api.get('/api/delivery-locations', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createDeliveryLocation: async (data: CreateDeliveryLocationForm): Promise<DeliveryLocationRecord> => {
    const response: AxiosResponse<ApiResponse<DeliveryLocationRecord>> = await api.post('/api/delivery-locations', data);
    return response.data.data!;
  },

  updateDeliveryLocation: async (
    uuid: string,
    data: Partial<Omit<CreateDeliveryLocationForm, 'customerUuid'>>,
  ): Promise<DeliveryLocationRecord> => {
    const response: AxiosResponse<ApiResponse<DeliveryLocationRecord>> = await api.put(`/api/delivery-locations/${uuid}`, data);
    return response.data.data!;
  },

  deleteDeliveryLocation: async (uuid: string): Promise<void> => {
    await api.delete(`/api/delivery-locations/${uuid}`);
  },
};

export const finishedGoodsApi = {
  getFinishedGoods: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<FinishedGood>> => {
    const response = await api.get('/api/finished-goods', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createFinishedGood: async (data: CreateFinishedGoodForm): Promise<FinishedGood> => {
    const response: AxiosResponse<ApiResponse<FinishedGood>> = await api.post('/api/finished-goods', data);
    return response.data.data!;
  },

  updateFinishedGood: async (uuid: string, data: Partial<CreateFinishedGoodForm>): Promise<FinishedGood> => {
    const response: AxiosResponse<ApiResponse<FinishedGood>> = await api.put(`/api/finished-goods/${uuid}`, data);
    return response.data.data!;
  },

  deleteFinishedGood: async (uuid: string): Promise<void> => {
    await api.delete(`/api/finished-goods/${uuid}`);
  },
};

export const warehousesApi = {
  getWarehouses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
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

export const paperSuppliesApi = {
  getPaperSupplies: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    manufacturerId?: string;
    supplierId?: string;
    paperTypeId?: string;
    companyId?: string;
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

export const paperSheetsApi = {
  getPaperSheets: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    supplierId?: string;
    manufacturerId?: string;
    corrugationId?: string;
    companyId?: string;
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

export const paperStockApi = {
  getPaperStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    paperSupplyId?: string;
    companyId?: string;
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

export const sheetStockApi = {
  getSheetStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    paperSheetId?: string;
    companyId?: string;
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

export const toolingTypesApi = {
  getToolingTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    code?: string;
    name?: string;
    automaticConsumption?: boolean;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<ToolingType>> => {
    const response = await api.get('/api/tooling-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getToolingTypeById: async (id: string): Promise<ToolingType> => {
    const response: AxiosResponse<ApiResponse<ToolingType>> = await api.get(`/api/tooling-type/${id}`);
    return response.data.data!;
  },

  createToolingType: async (data: CreateToolingTypeForm): Promise<ToolingType> => {
    const response: AxiosResponse<ApiResponse<ToolingType>> = await api.post('/api/tooling-type', data);
    return response.data.data!;
  },

  updateToolingType: async (id: string, data: Partial<CreateToolingTypeForm>): Promise<ToolingType> => {
    const response: AxiosResponse<ApiResponse<ToolingType>> = await api.put(`/api/tooling-type/${id}`, data);
    return response.data.data!;
  },

  deleteToolingType: async (id: string): Promise<void> => {
    await api.delete(`/api/tooling-type/${id}`);
  },
};

export const toolingsApi = {
  getToolings: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    name?: string;
    toolingTypeId?: string;
    manufacturerId?: string;
    supplierId?: string;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<Tooling>> => {
    const response = await api.get('/api/tooling', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getToolingById: async (id: string): Promise<Tooling> => {
    const response: AxiosResponse<ApiResponse<Tooling>> = await api.get(`/api/tooling/${id}`);
    return response.data.data!;
  },

  createTooling: async (data: CreateToolingForm): Promise<Tooling> => {
    const response: AxiosResponse<ApiResponse<Tooling>> = await api.post('/api/tooling', data);
    return response.data.data!;
  },

  updateTooling: async (id: string, data: Partial<CreateToolingForm>): Promise<Tooling> => {
    const response: AxiosResponse<ApiResponse<Tooling>> = await api.put(`/api/tooling/${id}`, data);
    return response.data.data!;
  },

  deleteTooling: async (id: string): Promise<void> => {
    await api.delete(`/api/tooling/${id}`);
  },
};

export const consumableTypesApi = {
  getConsumableTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    code?: string;
    name?: string;
    autoConsumption?: boolean;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<ConsumableType>> => {
    const response = await api.get('/api/consumable-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getConsumableTypeById: async (id: string): Promise<ConsumableType> => {
    const response: AxiosResponse<ApiResponse<ConsumableType>> = await api.get(`/api/consumable-type/${id}`);
    return response.data.data!;
  },

  createConsumableType: async (data: CreateConsumableTypeForm): Promise<ConsumableType> => {
    const response: AxiosResponse<ApiResponse<ConsumableType>> = await api.post('/api/consumable-type', data);
    return response.data.data!;
  },

  updateConsumableType: async (id: string, data: Partial<CreateConsumableTypeForm>): Promise<ConsumableType> => {
    const response: AxiosResponse<ApiResponse<ConsumableType>> = await api.put(`/api/consumable-type/${id}`, data);
    return response.data.data!;
  },

  deleteConsumableType: async (id: string): Promise<void> => {
    await api.delete(`/api/consumable-type/${id}`);
  },
};

export const consumableSuppliesApi = {
  getConsumableSupplies: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    code?: string;
    name?: string;
    consumableTypeId?: string;
    manufacturerId?: string;
    supplierId?: string;
    companyId?: number | string;
  } = {}): Promise<PaginatedResponse<ConsumableSupply>> => {
    const response = await api.get('/api/consumable-supply', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getConsumableSupplyById: async (id: string): Promise<ConsumableSupply> => {
    const response: AxiosResponse<ApiResponse<ConsumableSupply>> = await api.get(`/api/consumable-supply/${id}`);
    return response.data.data!;
  },

  createConsumableSupply: async (data: CreateConsumableSupplyForm): Promise<ConsumableSupply> => {
    const response: AxiosResponse<ApiResponse<ConsumableSupply>> = await api.post('/api/consumable-supply', data);
    return response.data.data!;
  },

  updateConsumableSupply: async (id: string, data: Partial<CreateConsumableSupplyForm>): Promise<ConsumableSupply> => {
    const response: AxiosResponse<ApiResponse<ConsumableSupply>> = await api.put(`/api/consumable-supply/${id}`, data);
    return response.data.data!;
  },

  deleteConsumableSupply: async (id: string): Promise<void> => {
    await api.delete(`/api/consumable-supply/${id}`);
  },
};

export const toolingStockApi = {
  getToolingStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    toolingId?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<ToolingStock>> => {
    const response = await api.get('/api/tooling-stock', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getToolingStockById: async (id: string): Promise<ToolingStock> => {
    const response: AxiosResponse<ApiResponse<ToolingStock>> = await api.get(`/api/tooling-stock/${id}`);
    return response.data.data!;
  },

  createToolingStock: async (data: CreateToolingStockForm): Promise<ToolingStock> => {
    const response: AxiosResponse<ApiResponse<ToolingStock>> = await api.post('/api/tooling-stock', data);
    return response.data.data!;
  },

  updateToolingStock: async (id: string, data: Partial<CreateToolingStockForm>): Promise<ToolingStock> => {
    const response: AxiosResponse<ApiResponse<ToolingStock>> = await api.put(`/api/tooling-stock/${id}`, data);
    return response.data.data!;
  },

  deleteToolingStock: async (id: string): Promise<void> => {
    await api.delete(`/api/tooling-stock/${id}`);
  },
};

export const consumableStockApi = {
  getConsumableStock: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    supplierId?: string;
    manufacturerId?: string;
    consumableSupplyId?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<ConsumableStock>> => {
    const response = await api.get('/api/consumable-stock', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getConsumableStockById: async (id: string): Promise<ConsumableStock> => {
    const response: AxiosResponse<ApiResponse<ConsumableStock>> = await api.get(`/api/consumable-stock/${id}`);
    return response.data.data!;
  },

  createConsumableStock: async (data: CreateConsumableStockForm): Promise<ConsumableStock> => {
    const response: AxiosResponse<ApiResponse<ConsumableStock>> = await api.post('/api/consumable-stock', data);
    return response.data.data!;
  },

  updateConsumableStock: async (id: string, data: Partial<CreateConsumableStockForm>): Promise<ConsumableStock> => {
    const response: AxiosResponse<ApiResponse<ConsumableStock>> = await api.put(`/api/consumable-stock/${id}`, data);
    return response.data.data!;
  },

  deleteConsumableStock: async (id: string): Promise<void> => {
    await api.delete(`/api/consumable-stock/${id}`);
  },
};

export const glueTypesApi = {
  getGlueTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<GlueType>> => {
    const response = await api.get('/api/glue-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getGlueTypeById: async (id: string): Promise<GlueType> => {
    const response: AxiosResponse<ApiResponse<GlueType>> = await api.get(`/api/glue-type/${id}`);
    return response.data.data!;
  },

  createGlueType: async (data: CreateGlueTypeForm): Promise<GlueType> => {
    const response: AxiosResponse<ApiResponse<GlueType>> = await api.post('/api/glue-type', data);
    return response.data.data!;
  },

  updateGlueType: async (id: string, data: Partial<CreateGlueTypeForm>): Promise<GlueType> => {
    const response: AxiosResponse<ApiResponse<GlueType>> = await api.put(`/api/glue-type/${id}`, data);
    return response.data.data!;
  },

  deleteGlueType: async (id: string): Promise<void> => {
    await api.delete(`/api/glue-type/${id}`);
  },
};

export const strappingTypesApi = {
  getStrappingTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<StrappingType>> => {
    const response = await api.get('/api/strapping-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getStrappingTypeById: async (id: string): Promise<StrappingType> => {
    const response: AxiosResponse<ApiResponse<StrappingType>> = await api.get(`/api/strapping-type/${id}`);
    return response.data.data!;
  },

  createStrappingType: async (data: CreateStrappingTypeForm): Promise<StrappingType> => {
    const response: AxiosResponse<ApiResponse<StrappingType>> = await api.post('/api/strapping-type', data);
    return response.data.data!;
  },

  updateStrappingType: async (id: string, data: Partial<CreateStrappingTypeForm>): Promise<StrappingType> => {
    const response: AxiosResponse<ApiResponse<StrappingType>> = await api.put(`/api/strapping-type/${id}`, data);
    return response.data.data!;
  },

  deleteStrappingType: async (id: string): Promise<void> => {
    await api.delete(`/api/strapping-type/${id}`);
  },
};

export const complementsApi = {
  getComplements: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Complement>> => {
    const response = await api.get('/api/complement', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getComplementById: async (id: string): Promise<Complement> => {
    const response: AxiosResponse<ApiResponse<Complement>> = await api.get(`/api/complement/${id}`);
    return response.data.data!;
  },

  createComplement: async (data: CreateComplementForm): Promise<Complement> => {
    const response: AxiosResponse<ApiResponse<Complement>> = await api.post('/api/complement', data);
    return response.data.data!;
  },

  updateComplement: async (id: string, data: Partial<CreateComplementForm>): Promise<Complement> => {
    const response: AxiosResponse<ApiResponse<Complement>> = await api.put(`/api/complement/${id}`, data);
    return response.data.data!;
  },

  deleteComplement: async (id: string): Promise<void> => {
    await api.delete(`/api/complement/${id}`);
  },
};

export const traceTypesApi = {
  getTraceTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<TraceType>> => {
    const response = await api.get('/api/trace-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getTraceTypeById: async (id: string): Promise<TraceType> => {
    const response: AxiosResponse<ApiResponse<TraceType>> = await api.get(`/api/trace-type/${id}`);
    return response.data.data!;
  },

  createTraceType: async (data: CreateTraceTypeForm): Promise<TraceType> => {
    const response: AxiosResponse<ApiResponse<TraceType>> = await api.post('/api/trace-type', data);
    return response.data.data!;
  },

  updateTraceType: async (id: string, data: Partial<CreateTraceTypeForm>): Promise<TraceType> => {
    const response: AxiosResponse<ApiResponse<TraceType>> = await api.put(`/api/trace-type/${id}`, data);
    return response.data.data!;
  },

  deleteTraceType: async (id: string): Promise<void> => {
    await api.delete(`/api/trace-type/${id}`);
  },
};

// ── RBAC (module 02) ──────────────────────────────────────────────────────────

export const rolesApi = {
  getRoles: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Role>> => {
    const response = await api.get('/api/roles', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getRole: async (uuid: string): Promise<Role> => {
    const response: AxiosResponse<ApiResponse<Role>> = await api.get(`/api/roles/${uuid}`);
    return response.data.data!;
  },

  createRole: async (data: CreateRoleForm): Promise<Role> => {
    const response: AxiosResponse<ApiResponse<Role>> = await api.post('/api/roles', data);
    return response.data.data!;
  },

  updateRole: async (uuid: string, data: Partial<CreateRoleForm>): Promise<Role> => {
    const response: AxiosResponse<ApiResponse<Role>> = await api.put(`/api/roles/${uuid}`, data);
    return response.data.data!;
  },

  deleteRole: async (uuid: string): Promise<void> => {
    await api.delete(`/api/roles/${uuid}`);
  },

  setRolePermissions: async (uuid: string, codes: string[]): Promise<string[]> => {
    const response: AxiosResponse<ApiResponse<{ codes: string[] }>> = await api.put(
      `/api/roles/${uuid}/permissions`,
      { codes }
    );
    return response.data.data!.codes;
  },

  assignRole: async (userUuid: string, roleUuid: string | null): Promise<void> => {
    await api.put('/api/roles/assign', { userUuid, roleUuid });
  },
};

export const permissionsApi = {
  getPermissions: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Permission>> => {
    // The catalogue is ~277 rows but the API caps limit at 100 —
    // page through until totalPages so the matrix gets the full set.
    const pageSize = 100;
    const first = await api.get('/api/permissions', {
      params: { ...params, limit: pageSize, page: 1 },
    });
    const all: Permission[] = [...first.data.data];
    const totalPages: number = first.data.totalPages ?? 1;
    for (let p = 2; p <= totalPages; p++) {
      const next = await api.get('/api/permissions', {
        params: { ...params, limit: pageSize, page: p },
      });
      all.push(...next.data.data);
    }
    return {
      data: all,
      total: first.data.totalCount,
      page: 1,
      limit: all.length,
      totalPages: 1,
    };
  },
};

// ── Files (module 01) ─────────────────────────────────────────────────────────

export const filesApi = {
  getFile: async (uuid: string): Promise<FileRecord | null> => {
    try {
      const response: AxiosResponse<ApiResponse<FileRecord>> = await api.get(`/api/files/${uuid}`);
      return response.data.data ?? null;
    } catch {
      return null;
    }
  },

  uploadFile: async (file: File, description?: string): Promise<FileRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    const response: AxiosResponse<ApiResponse<FileRecord>> = await api.post(
      '/api/files',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  /**
   * Download through axios (auth travels in the Authorization header, so a plain
   * <a href> would 401) and trigger a browser save.
   */
  downloadFile: async (fileRecord: FileRecord): Promise<void> => {
    const response = await api.get(`/api/files/${fileRecord.uuid}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileRecord.originalName || 'download');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (uuid: string): Promise<void> => {
    await api.delete(`/api/files/${uuid}`);
  },
};

export default api;
export const colorTypesApi = {
  getColorTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<ColorType>> => {
    const response = await api.get('/api/color-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createColorType: async (data: CreateColorTypeForm): Promise<ColorType> => {
    const response: AxiosResponse<ApiResponse<ColorType>> = await api.post('/api/color-type', data);
    return response.data.data!;
  },

  updateColorType: async (id: string, data: Partial<CreateColorTypeForm>): Promise<ColorType> => {
    const response: AxiosResponse<ApiResponse<ColorType>> = await api.put(`/api/color-type/${id}`, data);
    return response.data.data!;
  },

  deleteColorType: async (id: string): Promise<void> => {
    await api.delete(`/api/color-type/${id}`);
  },
};

export const colorsApi = {
  getColors: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Color>> => {
    const response = await api.get('/api/color', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createColor: async (data: CreateColorForm): Promise<Color> => {
    const response: AxiosResponse<ApiResponse<Color>> = await api.post('/api/color', data);
    return response.data.data!;
  },

  updateColor: async (id: string, data: Partial<CreateColorForm>): Promise<Color> => {
    const response: AxiosResponse<ApiResponse<Color>> = await api.put(`/api/color/${id}`, data);
    return response.data.data!;
  },

  deleteColor: async (id: string): Promise<void> => {
    await api.delete(`/api/color/${id}`);
  },
};

export const fscTypesApi = {
  getFscTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<FscType>> => {
    const response = await api.get('/api/fsc-type', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createFscType: async (data: CreateFscTypeForm): Promise<FscType> => {
    const response: AxiosResponse<ApiResponse<FscType>> = await api.post('/api/fsc-type', data);
    return response.data.data!;
  },

  updateFscType: async (id: string, data: Partial<CreateFscTypeForm>): Promise<FscType> => {
    const response: AxiosResponse<ApiResponse<FscType>> = await api.put(`/api/fsc-type/${id}`, data);
    return response.data.data!;
  },

  deleteFscType: async (id: string): Promise<void> => {
    await api.delete(`/api/fsc-type/${id}`);
  },
};


export const palletTypesApi = {
  getPalletTypes: async (params: { page?: number; limit?: number; search?: string; companyId?: string } = {}): Promise<PaginatedResponse<PalletType>> => {
    const response = await api.get('/api/pallet-types', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },
  createPalletType: async (data: CreatePalletTypeForm): Promise<PalletType> => {
    const response: AxiosResponse<ApiResponse<PalletType>> = await api.post('/api/pallet-types', data);
    return response.data.data!;
  },
  updatePalletType: async (uuid: string, data: Partial<CreatePalletTypeForm>): Promise<PalletType> => {
    const response: AxiosResponse<ApiResponse<PalletType>> = await api.put(`/api/pallet-types/${uuid}`, data);
    return response.data.data!;
  },
  deletePalletType: async (uuid: string): Promise<void> => {
    await api.delete(`/api/pallet-types/${uuid}`);
  },
};

export const palletizationsApi = {
  getPalletizations: async (params: { page?: number; limit?: number; search?: string; companyId?: string } = {}): Promise<PaginatedResponse<Palletization>> => {
    const response = await api.get('/api/palletizations', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },
  getPalletization: async (uuid: string): Promise<Palletization> => {
    const response: AxiosResponse<ApiResponse<Palletization>> = await api.get(`/api/palletizations/${uuid}`);
    return response.data.data!;
  },
  createPalletization: async (data: CreatePalletizationForm): Promise<Palletization> => {
    const response: AxiosResponse<ApiResponse<Palletization>> = await api.post('/api/palletizations', data);
    return response.data.data!;
  },
  updatePalletization: async (uuid: string, data: Partial<CreatePalletizationForm>): Promise<Palletization> => {
    const response: AxiosResponse<ApiResponse<Palletization>> = await api.put(`/api/palletizations/${uuid}`, data);
    return response.data.data!;
  },
  deletePalletization: async (uuid: string): Promise<void> => {
    await api.delete(`/api/palletizations/${uuid}`);
  },
};

// ── Machines (module 14 lite) ────────────────────────────────────────────────

export const machineTypesApi = {
  getMachineTypes: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<MachineType>> => {
    const response = await api.get('/api/machine-type', { params });
    const d = response.data;
    return { data: d.data, total: d.totalCount, page: d.page, limit: d.limit, totalPages: d.totalPages };
  },
  createMachineType: async (data: CreateMachineTypeForm): Promise<MachineType> => {
    const response: AxiosResponse<ApiResponse<MachineType>> = await api.post('/api/machine-type', data);
    return response.data.data!;
  },
  updateMachineType: async (uuid: string, data: Partial<CreateMachineTypeForm>): Promise<MachineType> => {
    const response: AxiosResponse<ApiResponse<MachineType>> = await api.put(`/api/machine-type/${uuid}`, data);
    return response.data.data!;
  },
  deleteMachineType: async (uuid: string): Promise<void> => {
    await api.delete(`/api/machine-type/${uuid}`);
  },
};

export const machinesApi = {
  getMachines: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<Machine>> => {
    const response = await api.get('/api/machine', { params });
    const d = response.data;
    return { data: d.data, total: d.totalCount, page: d.page, limit: d.limit, totalPages: d.totalPages };
  },
  createMachine: async (data: CreateMachineForm): Promise<Machine> => {
    const response: AxiosResponse<ApiResponse<Machine>> = await api.post('/api/machine', data);
    return response.data.data!;
  },
  updateMachine: async (uuid: string, data: Partial<CreateMachineForm>): Promise<Machine> => {
    const response: AxiosResponse<ApiResponse<Machine>> = await api.put(`/api/machine/${uuid}`, data);
    return response.data.data!;
  },
  deleteMachine: async (uuid: string): Promise<void> => {
    await api.delete(`/api/machine/${uuid}`);
  },
};

// ── Production routes (module 12) ────────────────────────────────────────────

export const productionRoutesApi = {
  getRoutes: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<ProductionRoute>> => {
    const response = await api.get('/api/production-routes', { params });
    const d = response.data;
    return { data: d.data, total: d.totalCount, page: d.page, limit: d.limit, totalPages: d.totalPages };
  },
  getRoute: async (uuid: string): Promise<ProductionRoute> => {
    const response: AxiosResponse<ApiResponse<ProductionRoute>> = await api.get(`/api/production-routes/${uuid}`);
    return response.data.data!;
  },
  createRoute: async (data: Partial<ProductionRoute> & { stages?: RouteStage[] }): Promise<ProductionRoute> => {
    const response: AxiosResponse<ApiResponse<ProductionRoute>> = await api.post('/api/production-routes', data);
    return response.data.data!;
  },
  updateRoute: async (uuid: string, data: Partial<ProductionRoute> & { stages?: RouteStage[] }): Promise<ProductionRoute> => {
    const response: AxiosResponse<ApiResponse<ProductionRoute>> = await api.put(`/api/production-routes/${uuid}`, data);
    return response.data.data!;
  },
  cloneRoute: async (uuid: string, name?: string): Promise<ProductionRoute> => {
    const response: AxiosResponse<ApiResponse<ProductionRoute>> = await api.post(`/api/production-routes/${uuid}/clone`, { name });
    return response.data.data!;
  },
  copyStages: async (uuid: string, sourceRouteUuid: string): Promise<ProductionRoute> => {
    const response: AxiosResponse<ApiResponse<ProductionRoute>> = await api.post(`/api/production-routes/${uuid}/copy-stages`, { sourceRouteUuid });
    return response.data.data!;
  },
  deleteRoute: async (uuid: string): Promise<void> => {
    await api.delete(`/api/production-routes/${uuid}`);
  },
};

// ── Parts (module 07) ────────────────────────────────────────────────────────
export const partsApi = {
  getParts: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<Part>> => {
    const response = await api.get('/api/parts', { params });
    const d = response.data;
    return { data: d.data, total: d.totalCount, page: d.page, limit: d.limit, totalPages: d.totalPages };
  },
  getPartsForProduct: async (productUuid: string, params: Record<string, unknown> = {}): Promise<PaginatedResponse<Part>> => {
    const response = await api.get(`/api/product/${productUuid}/parts`, { params });
    const d = response.data;
    return { data: d.data, total: d.totalCount, page: d.page, limit: d.limit, totalPages: d.totalPages };
  },
  getPart: async (uuid: string): Promise<Part> => {
    const response = await api.get(`/api/parts/${uuid}`);
    return response.data.data;
  },
  createPart: async (data: PartFormPayload): Promise<Part> => {
    const response = await api.post('/api/parts', data);
    return response.data.data;
  },
  updatePart: async (uuid: string, data: PartFormPayload): Promise<Part> => {
    const response = await api.put(`/api/parts/${uuid}`, data);
    return response.data.data;
  },
  deletePart: async (uuid: string): Promise<void> => {
    await api.delete(`/api/parts/${uuid}`);
  },
  cascade: async (uuid: string, field: string, value: number | null): Promise<Part> => {
    const response = await api.patch(`/api/parts/${uuid}/cascade`, { field, value });
    return response.data.data;
  },
  setApproval: async (uuid: string, machine: PartApprovalMachine, action: 'approve' | 'cancel'): Promise<Part> => {
    const response = await api.patch(`/api/parts/${uuid}/approval/${machine}`, { action });
    return response.data.data;
  },
  bulkApprove: async (uuids: string[]): Promise<number> => {
    const response = await api.post('/api/parts/bulk-approve', { uuids });
    return response.data.data.updated;
  },
  bulkUnapprove: async (uuids: string[]): Promise<number> => {
    const response = await api.post('/api/parts/bulk-unapprove', { uuids });
    return response.data.data.updated;
  },
};
