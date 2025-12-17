// User types
export interface User {
  id: string;
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Company types
export interface Company {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invitation types
export interface Invitation {
  id: string;
  email: string;
  role: 'member' | 'admin';
  companyId: string;
  companyName?: string;
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
  companyName?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;
}

// Form types
export interface CreateCompanyForm {
  name: string;
  description?: string;
}

export interface InviteUserForm {
  email: string;
  role: 'member' | 'admin';
  companyId?: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'member' | 'admin' | 'superAdmin';
  isActive: boolean;
  companyId?: string;
  password?: string;
}

export interface AcceptInvitationForm {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  roles: string[];
  children?: NavItem[];
}

// Statistics types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: { role: string; count: number }[];
  recentInvitations: number;
}

export interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  companiesWithUsers: number;
  averageUsersPerCompany: number;
}

export interface InvitationStats {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
}

// Customer Category types
export interface CustomerCategory {
  id: string;
  uuid: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  role: string;
  name: string;
  phone: string;
  altPhone?: string;
  mobile?: string;
  email?: string;
  notes?: string;
}

export interface DeliveryLocation {
  code: string;
  address: string;
  availableTimes?: string;
  lat?: string;
  lon?: string;
  deliveryZone?: string;
}

export interface DeliveryDay {
  day: string;
  from: string;
  to: string;
}

export interface Customer {
  id: string;
  uuid: string;
  companyId: string;
  name: string;
  supplierCode?: string;
  salesPersonId?: string;
  salesPersonName?: string;
  categoryId?: string;
  categoryName?: string;
  active: boolean;
  legalName?: string;
  legalCode?: string;
  address?: string;
  tradeName?: string;
  contacts: ContactInfo[];
  deliveryLocations: DeliveryLocation[];
  deliveryDays: DeliveryDay[];
  createdAt: string;
  updatedAt: string;
  // Related objects with UUIDs (from getCustomerWithDetails)
  category?: CustomerCategory;
  salesPerson?: User;
  company?: Company;
}

export interface CreateCustomerCategoryForm {
  name: string;
  companyId?: string;
}

export interface CreateCustomerForm {
  name: string;
  supplierCode?: string;
  salesPersonId?: string;
  categoryId?: string;
  active?: boolean;
  legalName?: string;
  legalCode?: string;
  address?: string;
  tradeName?: string;
  contacts?: ContactInfo[];
  deliveryLocations?: DeliveryLocation[];
  deliveryDays?: DeliveryDay[];
  companyId?: string;
}

// Paper Type types
export interface PaperType {
  id: string;
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperTypeForm {
  code: string;
  description?: string;
}

// Flute Type types
export interface FluteType {
  id: string;
  uuid: string;
  code: string;
  description?: string;
  fluteFactor?: number;
  length?: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFluteTypeForm {
  code: string;
  description?: string;
  fluteFactor?: number;
  length?: number;
  width?: number;
  height?: number;
}

// Paper Class types
export interface PaperClass {
  id: string;
  uuid: string;
  code: string;
  name: string;
  papers?: number[]; // Array of paper supply IDs
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperClassForm {
  code: string;
  name: string;
  papers?: number[]; // Array of paper supply IDs
}

// Product types
export interface Product {
  id: string;
  uuid: string;
  code: string;
  clientCode?: string;
  description?: string;
  customerId: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductForm {
  code: string;
  clientCode?: string;
  description?: string;
  customerId: string;
}

// Manufacturer types
export interface Manufacturer {
  id: string;
  uuid: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManufacturerForm {
  code: string;
  name: string;
}

// Supplier types
export interface Supplier {
  id: string;
  uuid: string;
  code: string;
  suppliesSheets: boolean;
  suppliesElaborated: boolean;
  suppliesConsumables: boolean;
  suppliesPaper: boolean;
  suppliesTooling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierForm {
  code: string;
  suppliesSheets?: boolean;
  suppliesElaborated?: boolean;
  suppliesConsumables?: boolean;
  suppliesPaper?: boolean;
  suppliesTooling?: boolean;
}

// Warehouse types
export interface Warehouse {
  id: string;
  uuid: string;
  name: string;
  gridRows?: number;
  gridCols?: number;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseForm {
  name: string;
  gridRows?: number;
  gridCols?: number;
  companyId?: string;
}

// Warehouse Location types
export interface WarehouseLocation {
  id: string;
  uuid: string;
  warehouseId: number;
  row: number;
  col: number;
  status: 'active' | 'inactive';
  locationType: 'storage' | 'receiving' | 'shipping' | 'quarantine' | 'wip';
  locationCode: string;
  capacity?: {
    maxWeight?: number;
    maxVolume?: number;
    maxPallets?: number;
    unit?: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BatchUpdateLocation {
  row: number;
  col: number;
  status?: string;
  locationType?: string;
  locationCode?: string;
  capacity?: any;
  metadata?: any;
}

// Paper Supply types
export interface PaperSupply {
  id: string;
  uuid: string;
  code: string;
  description?: string;
  name: string;
  manufacturerId?: string;
  manufacturerName?: string; // Deprecated: use manufacturer.name instead
  manufacturer?: Manufacturer; // Full manufacturer object from API
  supplierId?: string;
  supplierCode?: string; // Deprecated: use supplier.code instead
  supplier?: Supplier; // Full supplier object from API
  minimumStock?: {
    pallets: number;
    boxes: number;
  };
  minimumStockPallets?: number; // Deprecated: use minimumStock.pallets instead
  minimumStockBoxes?: number; // Deprecated: use minimumStock.boxes instead
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperSupplyForm {
  code: string;
  description?: string;
  name: string;
  manufacturerId?: string;
  supplierId?: string;
  minimumStockPallets?: number;
  minimumStockBoxes?: number;
}