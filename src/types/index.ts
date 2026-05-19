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

export interface Company {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  roles: string[];
  children?: NavItem[];
}

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

export interface PaperType {
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

export interface FluteType {
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

export interface FlapType {
  uuid: string;
  code: string;
  description?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlapTypeForm {
  code: string;
  description?: string;
  companyId?: string;
}

export interface ProductType {
  uuid: string;
  code: string;
  name: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductTypeForm {
  code: string;
  name: string;
  companyId?: string;
}

export interface BoxType {
  uuid: string;
  code: string;
  name: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoxTypeForm {
  code: string;
  name: string;
  companyId?: string;
}

export interface PaperClass {
  uuid: string;
  code: string;
  name: string;
  papers?: string[]; // Array of paper supply UUIDs
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperClassForm {
  code: string;
  name: string;
  papers?: string[]; // Array of paper supply UUIDs
}

// SECURITY: No numeric IDs - only UUIDs exposed to frontend
export interface CorrugationClass {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorrugationClassForm {
  code: string;
  description?: string;
}

// SECURITY: No numeric IDs - only UUIDs exposed to frontend
export interface Corrugation {
  uuid: string;
  code: string;
  description?: string;
  theoreticalGrammage?: number;
  suggestedWidth?: number;
  caliper?: number;
  // Related object with UUID (not numeric foreign key)
  corrugationClass?: CorrugationClass;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorrugationForm {
  code: string;
  description?: string;
  theoreticalGrammage?: number;
  suggestedWidth?: number;
  caliper?: number;
  // Use UUID to reference corrugation class, not numeric ID
  corrugationClassUuid?: string;
}

export interface Product {
  id: string;
  uuid: string;
  code: string;
  clientCode?: string;
  description?: string;
  customerId: string;
  customerName?: string; // Deprecated: use customer.name instead
  customer?: Customer;
  revision?: number;
  vip?: boolean;
  productTypeId?: string;
  boxTypeId?: string;
  productType?: ProductType;
  boxType?: BoxType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductForm {
  code: string;
  clientCode?: string;
  description?: string;
  customerId: string;
  revision?: number;
  vip?: boolean;
  productTypeId?: string;
  boxTypeId?: string;
}

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

export interface WarehouseLocation {
  uuid: string;
  warehouseUuid: string;
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

export interface PaperSupply {
  uuid: string;
  code: string;
  description?: string;
  name: string;
  manufacturerId?: string;
  manufacturerName?: string; // Deprecated: use manufacturer.name instead
  manufacturer?: Manufacturer;
  supplierId?: string;
  supplierCode?: string; // Deprecated: use supplier.code instead
  supplier?: Supplier;
  paperTypeId?: string;
  paperType?: PaperType;
  grammage?: number;
  price?: number;
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
  paperTypeId?: string;
  grammage?: number;
  price?: number;
  minimumStockPallets?: number;
  minimumStockBoxes?: number;
}

export interface PaperSheet {
  uuid: string;
  code: string;
  name: string;
  description?: string;
  minimumStock?: number;
  length?: number;
  width?: number;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  corrugation?: Corrugation;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperSheetForm {
  code: string;
  name: string;
  description?: string;
  supplierId?: string;
  manufacturerId?: string;
  corrugationId?: string;
  minimumStock?: number;
  length?: number;
  width?: number;
}

export interface PaperStock {
  uuid: string;
  warehouseLocationId?: number;
  comments?: string;
  price?: number;
  weight?: number;
  diameter?: number;
  width?: number;
  warehouse?: Warehouse;
  warehouseLocation?: WarehouseLocation;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  paperSupply?: PaperSupply;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperStockForm {
  warehouseId: string;
  warehouseLocationId?: string;
  supplierId?: string;
  manufacturerId?: string;
  paperSupplyId: string;
  comments?: string;
  price?: number;
  weight?: number;
  diameter?: number;
  width?: number;
}

export interface SheetStock {
  uuid: string;
  comments?: string;
  price?: number;
  quantity: number;
  warehouse?: Warehouse;
  warehouseLocation?: WarehouseLocation;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  paperSheet?: PaperSheet;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSheetStockForm {
  warehouseId: string;
  warehouseLocationId?: string;
  supplierId?: string;
  manufacturerId?: string;
  paperSheetId: string;
  comments?: string;
  price?: number;
  quantity: number;
}

export interface LocationStock {
  locationUuid: string;
  locationCode: string;
  row: number;
  col: number;
  locationType: string;
  paperStock: PaperStock[];
  sheetStock: SheetStock[];
  totalItems: number;
}

export interface WarehouseStockResponse {
  warehouse: Warehouse;
  locations: LocationStock[];
  unassignedPaperStock: PaperStock[];
  unassignedSheetStock: SheetStock[];
  totalPaperStock: number;
  totalSheetStock: number;
}

export interface ToolingType {
  uuid: string;
  code: string;
  name: string;
  description?: string;
  automaticConsumption?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolingTypeForm {
  code: string;
  name: string;
  description?: string;
  automaticConsumption?: boolean;
}

export interface Tooling {
  uuid: string;
  name: string;
  description?: string;
  minimumStock?: number;
  manufacturer?: Manufacturer;
  supplier?: Supplier;
  toolingType?: ToolingType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolingForm {
  name: string;
  description?: string;
  manufacturerUuid?: string;
  supplierUuid?: string;
  minimumStock?: number;
  toolingTypeUuid: string;
}

export interface ConsumableType {
  uuid: string;
  code: string;
  name: string;
  autoConsumption?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumableTypeForm {
  code: string;
  name: string;
  autoConsumption?: boolean;
}

export interface ConsumableSupply {
  uuid: string;
  code: string;
  name: string;
  description?: string;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  consumableType?: ConsumableType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumableSupplyForm {
  code: string;
  name: string;
  description?: string;
  supplierUuid?: string;
  manufacturerUuid?: string;
  consumableTypeUuid: string;
}

export interface ToolingStock {
  uuid: string;
  comments?: string;
  price?: number;
  quantity: number;
  warehouse?: Warehouse;
  warehouseLocation?: WarehouseLocation;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  tooling?: Tooling;
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolingStockForm {
  warehouseUuid: string;
  warehouseLocationUuid?: string;
  supplierUuid?: string;
  manufacturerUuid?: string;
  toolingUuid: string;
  comments?: string;
  price?: number;
  quantity: number;
}

export interface GlueType {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlueTypeForm {
  code: string;
  description?: string;
  companyId?: string;
}

export interface StrappingType {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrappingTypeForm {
  code: string;
  description?: string;
  companyId?: string;
}

export interface Complement {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplementForm {
  code: string;
  description?: string;
  companyId?: string;
}

export interface TraceType {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTraceTypeForm {
  code: string;
  description?: string;
  companyId?: string;
}

export interface ConsumableStock {
  uuid: string;
  comments?: string;
  price?: number;
  quantity: number;
  warehouse?: Warehouse;
  warehouseLocation?: WarehouseLocation;
  supplier?: Supplier;
  manufacturer?: Manufacturer;
  consumableSupply?: ConsumableSupply;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumableStockForm {
  warehouseUuid: string;
  warehouseLocationUuid?: string;
  supplierUuid?: string;
  manufacturerUuid?: string;
  consumableSupplyUuid: string;
  comments?: string;
  price?: number;
  quantity: number;
}