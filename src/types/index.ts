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
  /** RBAC permission codes granted via the user's role (empty when no role assigned). */
  permissions?: string[];
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

/** @deprecated legacy jsonb shape — delivery locations are a real resource now (DeliveryLocationRecord). */
export interface DeliveryLocation {
  code: string;
  address: string;
  availableTimes?: string;
  lat?: string;
  lon?: string;
  deliveryZone?: string;
}

export interface DeliveryZone {
  uuid: string;
  code?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryZoneForm {
  code?: string;
  description?: string;
}

/** A delivery location row from /api/delivery-locations (module 16). */
export interface DeliveryLocationRecord {
  uuid: string;
  address?: string;
  schedule?: string;
  latitude?: number | null;
  longitude?: number | null;
  externalSystemCode?: string;
  deliveryZone?: { uuid: string; code?: string; description?: string } | null;
  customer?: { uuid: string; name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryLocationForm {
  customerUuid: string;
  address?: string;
  schedule?: string;
  latitude?: number;
  longitude?: number;
  externalSystemCode?: string;
  deliveryZoneUuid: string;
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
  code?: string;
  dispatchable?: boolean;
  notes?: string;
  excludeLogoOnLabels?: boolean;
  requiresQualityCertificate?: boolean;
  contacts: ContactInfo[];
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
  code?: string;
  dispatchable?: boolean;
  notes?: string;
  excludeLogoOnLabels?: boolean;
  requiresQualityCertificate?: boolean;
  contacts?: ContactInfo[];
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
/** One Capa row of a Corrugation (as returned by GET /corrugation/:uuid). */
export interface CorrugationLayer {
  uuid?: string;
  position: number;
  isLiner: boolean;
  paperClass?: { uuid: string; code?: string; name?: string; description?: string } | null;
  fluteType?: { uuid: string; code?: string; description?: string } | null;
}

/** One Capa row as sent on create/update. */
export interface CorrugationLayerInput {
  /** Server-assigned; present only on layers loaded from the API. Sent back on
   * save so the backend diffs the collection instead of rewriting it. */
  uuid?: string;
  position: number;
  isLiner: boolean;
  paperClassUuid?: string;
  fluteTypeUuid?: string;
}

export interface Corrugation {
  uuid: string;
  code: string;
  description?: string;
  theoreticalGrammage?: number;
  suggestedWidth?: number;
  caliper?: number;
  // Related object with UUID (not numeric foreign key)
  corrugationClass?: CorrugationClass;
  layers?: CorrugationLayer[];
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
  layers?: CorrugationLayerInput[];
}

export interface FinishedGood {
  uuid: string;
  code?: string;
  name: string;
  description?: string;
  minimumStock?: number | null;
  supplier?: { uuid: string; name?: string; code?: string } | null;
  manufacturer?: { uuid: string; name?: string; code?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFinishedGoodForm {
  code?: string;
  name: string;
  description?: string;
  supplierUuid?: string;
  manufacturerUuid?: string;
  minimumStock?: number;
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
  technicalSheetFileUuid?: string | null;
  blueprintFileUuid?: string | null;
  sketchFileUuid?: string | null;
  imageFileUuid?: string | null;
  productApprovalAt?: string | null;
  productApprovalBy?: string | null;
  productCancellationAt?: string | null;
  productCancellationBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simple-product atomic create (module 06 ProductoSimpleForm): the first part
 * created together with the product. Code is server-derived ({producto}/1);
 * description defaults to the product's when omitted.
 */
export interface CreateProductInitialPart {
  description?: string;
  corrugationUuid: string;
  productionRouteUuid?: string;
  modelUuid?: string;
  flapTypeUuid?: string;
  glueTypeUuid?: string;
  sheetLength?: number;
  sheetWidth?: number;
  boxLength?: number;
  boxWidth?: number;
  boxHeight?: number;
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
  technicalSheetFileUuid?: string | null;
  blueprintFileUuid?: string | null;
  sketchFileUuid?: string | null;
  imageFileUuid?: string | null;
  initialPart?: CreateProductInitialPart;
  // superAdmin operating-as: resolved by the backend; ignored for regular users.
  companyId?: string;
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
  color?: string;
  fscTypeId?: number | null;
  /** Nested FSC type (uuid-keyed) — the edit form preselects from this. */
  fscType?: { uuid: string; code?: string | null; description?: string | null } | null;
  /** Corrected shape: Procusto paper min-stock is one roll spec (kg + mm). */
  minimumStock?: {
    weightKg?: number | null;
    diameterMm?: number | null;
  };
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
  color?: string;
  /** FSC type uuid — resolved to a numeric id by the API (manufacturerId convention). */
  fscTypeId?: string;
  minimumStockWeightKg?: number;
  minimumStockDiameterMm?: number;
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
  code?: string;
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
  code?: string;
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
  location?: string;
  /** Free text by design (Procusto stores strings like "15-07-22"). */
  expiry?: string;
  minimumStock?: number | null;
  colorId?: number | null;
  /** Nested color (uuid-keyed) — the edit form preselects from this. */
  color?: { uuid: string; code?: string | null; name?: string | null } | null;
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
  location?: string;
  expiry?: string;
  minimumStock?: number;
  colorUuid?: string;
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

export interface ColorType {
  uuid: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColorTypeForm {
  name: string;
  description?: string;
  companyId?: string;
}

export interface Color {
  uuid: string;
  code: string;
  name?: string;
  description?: string;
  observations?: string;
  tonality?: number | null;
  colorTypeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColorForm {
  code: string;
  name?: string;
  description?: string;
  observations?: string;
  tonality?: number;
  colorTypeUuid?: string;
  companyId?: string;
}

export interface FscType {
  uuid: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFscTypeForm {
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
// ── RBAC (module 02) ──────────────────────────────────────────────────────────

export type RoleProfileType =
  | 'director'
  | 'general'
  | 'productionManager'
  | 'qualityManager'
  | 'salesperson';

export interface Role {
  id?: number;
  uuid: string;
  name: string;
  profileType: RoleProfileType;
  hasAccessToAllMachines: boolean;
  isProtected: boolean;
  /** Granted permission codes — populated by GET /roles/:uuid. */
  permissionCodes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleForm {
  name: string;
  profileType?: RoleProfileType;
  hasAccessToAllMachines?: boolean;
}

export interface Permission {
  uuid: string;
  code: string;
  /** Legacy Spanish gate-key name (display). */
  name: string;
  description?: string;
  readOnly: boolean;
  area?: string;
  deprecated?: boolean;
}

// ── Files (module 01) ─────────────────────────────────────────────────────────

export interface FileRecord {
  uuid: string;
  originalName: string;
  description?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string;
}

export interface PalletType {
  uuid: string;
  code?: string | null;
  description?: string | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  height?: number | null;
  createdAt?: string;
}

export interface CreatePalletTypeForm {
  code?: string;
  description?: string;
  length?: number;
  width?: number;
  weight?: number;
  height?: number;
}

export interface Palletization {
  uuid: string;
  code?: string | null;
  name: string;
  description?: string | null;
  boxesPerPackage: number;
  packagesPerLevel: number;
  levelsPerPallet: number;
  additionalPackages: number;
  sheetsPerPallet: number;
  maxPalletHeight?: number | null;
  surface?: number | null;
  stackingType?: string | null;
  observations?: string | null;
  technicalFileUuid?: string | null;
  imageFileUuid?: string | null;
  boxesPerPallet?: number;
  palletType?: PalletType | null;
  createdAt?: string;
}

export interface CreatePalletizationForm {
  code?: string;
  name: string;
  description?: string;
  boxesPerPackage?: number;
  packagesPerLevel?: number;
  levelsPerPallet?: number;
  additionalPackages?: number;
  sheetsPerPallet?: number;
  maxPalletHeight?: number;
  surface?: number;
  stackingType?: string;
  observations?: string;
  technicalFileUuid?: string | null;
  imageFileUuid?: string | null;
  palletTypeUuid?: string;
}

// ── Models (module 08 — box models + formula engine) ─────────────────────────

export interface ModelTextOnImage {
  x: number;
  y: number;
  texto: string;
  campo: string;
}

export interface Model {
  uuid: string;
  code?: string | null;
  description: string;
  sheetLengthFormula?: string | null;
  sheetWidthFormula?: string | null;
  corrugationScoreLineFormulas?: string | null;
  printScoreLineFormulas?: string | null;
  lowerFlapFormula?: string | null;
  upperFlapFormula?: string | null;
  externalLengthDeltaFormula?: string | null;
  externalWidthDeltaFormula?: string | null;
  externalHeightDeltaFormula?: string | null;
  boxSurfaceFormula?: string | null;
  imageFileUuid?: string | null;
  textsOnImage?: ModelTextOnImage[];
  flapTypeUuid?: string | null;
  complementUuid?: string | null;
  flapType?: { uuid: string; code?: string | null; description?: string | null } | null;
  complement?: { uuid: string; code?: string | null; description?: string | null } | null;
  createdAt?: string;
}

export interface CreateModelForm {
  code: string;
  description: string;
  sheetLengthFormula?: string | null;
  sheetWidthFormula?: string | null;
  corrugationScoreLineFormulas?: string | null;
  printScoreLineFormulas?: string | null;
  lowerFlapFormula?: string | null;
  upperFlapFormula?: string | null;
  externalLengthDeltaFormula?: string | null;
  externalWidthDeltaFormula?: string | null;
  externalHeightDeltaFormula?: string | null;
  boxSurfaceFormula?: string | null;
  imageFileUuid?: string | null;
  textsOnImage?: ModelTextOnImage[];
  flapTypeUuid?: string | null;
  complementUuid?: string | null;
  companyId?: string;
}

export interface FormulaReference {
  parameters: { name: string; label: string; example: number }[];
  functions: { name: string; signature: string; description: string }[];
  operators: { symbol: string; description: string }[];
}

export interface FormulaTestResult {
  ok: boolean;
  error?: string;
  exampleValue?: number | null;
  exampleValueText?: string;
}

// ── Machines (module 14 lite) ────────────────────────────────────────────────

export interface MachineType {
  uuid: string;
  name: string;
  location?: number | null;
  requiresDie: boolean;
  requiresPlate: boolean;
  attribute?: string | null;
  corrugated: boolean;
  generatesSheets?: boolean | null;
  createdAt?: string;
}

export interface CreateMachineTypeForm {
  name: string;
  location?: number;
  requiresDie?: boolean;
  requiresPlate?: boolean;
  attribute?: string;
  corrugated?: boolean;
  generatesSheets?: boolean;
  companyId?: string;
}

export interface Machine {
  uuid: string;
  code?: string | null;
  description?: string | null;
  setupTime?: number;
  sheetWidthMin?: number | null;
  sheetWidthMax?: number | null;
  sheetLengthMin?: number | null;
  sheetLengthMax?: number | null;
  width?: number | null;
  maxScoreLines?: number | null;
  linearMeters?: number | null;
  machineType?: { uuid: string; name?: string; corrugated?: boolean } | null;
  sourceWarehouse?: { uuid: string; name?: string } | null;
  destinationWarehouse?: { uuid: string; name?: string } | null;
  createdAt?: string;
}

export interface CreateMachineForm {
  code?: string;
  description?: string;
  machineTypeUuid: string;
  setupTime?: number;
  sheetWidthMin?: number;
  sheetWidthMax?: number;
  sheetLengthMin?: number;
  sheetLengthMax?: number;
  sourceWarehouseUuid?: string;
  destinationWarehouseUuid?: string;
  companyId?: string;
}

// ── Production routes (module 12) ────────────────────────────────────────────

export type StageSupplyDirection = 'input' | 'output';
export type StageSupplyType = 'paper' | 'sheet' | 'consumable' | 'tooling' | 'finishedGood';

export interface RouteStageSupply {
  /** Stable client-side identity for React keys (never sent to the API). */
  clientId?: string;
  uuid?: string;
  direction: StageSupplyDirection;
  supplyType: StageSupplyType;
  supplyUuid?: string;
  quantity?: number | null;
  repetitionsWidth?: number;
  repetitionsLength?: number;
  allowsSimilar?: boolean;
  notes?: string | null;
  supply?: { uuid: string; code?: string | null; name?: string | null } | null;
}

export interface RouteStageMachine {
  /** Stable client-side identity for React keys (never sent to the API). */
  clientId?: string;
  machineUuid?: string;
  isPrimary: boolean;
  machine?: { uuid: string; code?: string | null; description?: string | null } | null;
}

export interface RouteStage {
  uuid?: string;
  /** Stable client-side identity for React keys/radio groups (never sent to the API). */
  clientId?: string;
  number: number;
  description?: string | null;
  isCorrugation?: boolean | null;
  setupTimeMinutes?: number;
  machineTypeUuid?: string;
  machineType?: { uuid: string; name?: string; corrugated?: boolean } | null;
  machines: RouteStageMachine[];
  supplies: RouteStageSupply[];
}

export interface ProductionRoute {
  uuid: string;
  name: string;
  isGlobal: boolean;
  active: boolean;
  isDefault: boolean;
  stageCount?: number;
  stages?: RouteStage[];
  createdAt?: string;
}

export interface RouteProblem {
  code: string;
  message: string;
  stageNumber?: number;
}

// ── Parts (module 07) ────────────────────────────────────────────────────────
export type PartApprovalMachine = 'dimensions' | 'technical' | 'sketch' | 'part';

export interface Part {
  uuid: string;
  code?: string | null;
  revision?: number;
  clientCode?: string | null;
  description?: string | null;
  boxLength?: number | null;
  boxWidth?: number | null;
  boxHeight?: number | null;
  externalLength?: number | null;
  externalWidth?: number | null;
  externalHeight?: number | null;
  sheetLength?: number | null;
  sheetWidth?: number | null;
  additionalSheetLength?: number | null;
  preferredWidth?: number | null;
  flap?: number | null;
  lowerFlap?: number | null;
  upperFlap?: number | null;
  flapOverlap?: number | null;
  corrugationScoreLines?: string | null;
  printScoreLines?: string | null;
  symmetricScoreLines?: boolean;
  colorCount?: number | null;
  printSides?: number | null;
  inks?: string | null;
  labelsPerPallet?: number | null;
  labelText?: string | null;
  printCode?: boolean;
  printDate?: boolean;
  printRecyclable?: boolean;
  printWarranty?: boolean;
  printLogo?: boolean;
  printNationalIndustry?: boolean;
  printExport?: boolean;
  compressionTest?: number | null;
  burstTest?: number | null;
  cobbTest?: number | null;
  ect?: number | null;
  grammage?: number | null;
  lengthUpperTolerance?: number | null;
  lengthLowerTolerance?: number | null;
  widthUpperTolerance?: number | null;
  widthLowerTolerance?: number | null;
  overrunPercentage?: number | null;
  underrunPercentage?: number | null;
  corrugationOverproduction?: number | null;
  allowsRotation?: boolean;
  allowsPartialRotation?: boolean;
  mandatoryRotation?: boolean;
  boxSurface?: number | null;
  boxWeight?: number | null;
  averageWeight?: number | null;
  allowsGluing?: boolean;
  claspClosure?: string | null;
  associatedQuantity?: number | null;
  foodSafetyNumber?: string | null;
  blueprintRef?: string | null;
  notes?: string | null;
  quotingNotes?: string | null;
  dataSheetFileUuid?: string | null;
  sketchFileUuid?: string | null;
  blueprintFileUuid?: string | null;
  imageFileUuid?: string | null;
  effectiveGrammage?: number | null;
  sheetSurface?: number | null;
  longDescription?: string;
  dimensionsApprovalAt?: string | null;
  dimensionsApprovalBy?: string | null;
  dimensionsCancelledAt?: string | null;
  dimensionsCancelledBy?: string | null;
  technicalApprovalAt?: string | null;
  technicalApprovalBy?: string | null;
  technicalCancelledAt?: string | null;
  technicalCancelledBy?: string | null;
  partApprovalAt?: string | null;
  partApprovalBy?: string | null;
  partCancelledAt?: string | null;
  partCancelledBy?: string | null;
  createdAt?: string;
  product?: { uuid: string; code?: string; description?: string | null; customer?: { uuid: string; name?: string } | null } | null;
  corrugation?: { uuid: string; code?: string; theoreticalGrammage?: number | null } | null;
  productionRoute?: { uuid: string; name?: string; isGlobal?: boolean } | null;
  palletization?: { uuid: string; code?: string | null; name?: string | null } | null;
  flapType?: { uuid: string; code?: string } | null;
  glueType?: { uuid: string; code?: string } | null;
  strappingType?: { uuid: string; code?: string } | null;
  traceType?: { uuid: string; code?: string } | null;
  complement?: { uuid: string; code?: string } | null;
  [key: string]: any;
}

export interface PartFormPayload {
  productUuid?: string;
  corrugationUuid?: string;
  productionRouteUuid?: string;
  palletizationUuid?: string;
  flapTypeUuid?: string;
  glueTypeUuid?: string;
  strappingTypeUuid?: string;
  traceTypeUuid?: string;
  complementUuid?: string;
  [key: string]: any;
}

/**
 * Pedido (module 18 sub-area D). Derived server-side, never stored: first
 * match wins in this order (see the API's sales-order.interfaces.ts).
 */
export type SalesOrderStatus =
  | 'voided'
  | 'fulfilled'
  | 'approved'
  | 'financially-approved'
  | 'commercially-approved'
  | 'pending';

/** The two permission-gated approval machines of a pedido. */
export type SalesOrderApprovalMachine = 'commercial' | 'financial';

/** DatosPedido — the 1:1 production-side header of a pedido. */
export interface SalesOrderOrderData {
  uuid: string;
  number?: string | null;
  quantity?: number;
  notes?: string | null;
  dispatchNotes?: string | null;
  conversionNotes?: string | null;
  deliveryLocation?: { uuid: string; address?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
}

/** SECURITY: uuid-only — the API never returns a numeric id. */
export interface SalesOrder {
  uuid: string;
  number: string;
  quantity: number;
  price?: number | null;
  paid?: number | null;
  /** Derived: price × quantity, null without a price. */
  priceTotal?: number | null;
  deliveryDate?: string | null;
  purchaseOrder?: string | null;
  supplierCode?: string | null;
  /** Present only for callers holding orders.view-sales-sector. */
  salesSector?: string | null;
  needsAdvanceInvoice?: boolean | null;
  invoiceSent?: boolean | null;
  stockOrder?: boolean;
  specialOrder?: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;

  customer?: { uuid: string; name?: string | null; code?: string | null } | null;
  product?: {
    uuid: string;
    code?: string | null;
    description?: string | null;
  } | null;
  salesUser?: {
    uuid: string;
    name?: string | null;
    email?: string | null;
  } | null;
  orderData?: SalesOrderOrderData | null;

  // Approval lifecycle pairs, as the API returns them (ISO strings).
  commercialApprovedAt?: string | null;
  commercialApprovedBy?: string | null;
  commercialCancelledAt?: string | null;
  commercialCancelledBy?: string | null;
  financialApprovedAt?: string | null;
  financialApprovedBy?: string | null;
  financialCancelledAt?: string | null;
  financialCancelledBy?: string | null;
  /** Written by the credit engine only — read-only here. */
  creditLimitOverrideAt?: string | null;
  creditLimitOverrideBy?: string | null;

  // Cumplimiento and anulación pairs, as the API returns them (ISO strings).
  fulfilledAt?: string | null;
  fulfilledBy?: string | null;
  fulfillmentCancelledAt?: string | null;
  fulfillmentCancelledBy?: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidCancelledAt?: string | null;
  voidCancelledBy?: string | null;

  /**
   * Grid column 6, built server-side from the pedido's producto / parte /
   * plancha (`Producto: <code> - <description> - Revisión: <rev>`).
   */
  itemDescription?: string;

  // Derived lifecycle read-outs.
  status?: SalesOrderStatus;
  commerciallyApproved?: boolean;
  financiallyApproved?: boolean;
  fulfilled?: boolean;
  voided?: boolean;
  creditLimitOverridden?: boolean;
}

/** One row of `GET /sales-orders/:uuid/production-orders` (uuid-only). */
export interface SalesOrderProductionOrder {
  uuid: string;
  number: string;
  orderDate?: string | null;
  deliveryDate?: string | null;
  quantity: number;
  part?: { uuid: string; code?: string | null; description?: string | null } | null;
  customer?: { uuid: string; name?: string | null } | null;
  schedulingApprovedAt?: string | null;
  completedAt?: string | null;
  voidedAt?: string | null;
}

/**
 * The pedido grid's filter bar, as the API receives it: flat `?field=value`,
 * booleans as the strings `'true'` / `'false'` (the API rejects anything else),
 * and AT MOST ONE of productUuid / partUuid / sheetSupplyUuid (the exclusive
 * radio trio).
 */
export interface SalesOrderListFilters {
  number?: string;
  customerUuid?: string;
  productUuid?: string;
  partUuid?: string;
  sheetSupplyUuid?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  fulfilled?: 'true' | 'false';
  voided?: 'true' | 'false';
  onlyApproved?: 'true' | 'false';
  withoutProductionOrders?: 'true' | 'false';
  allProductionOrdersFulfilled?: 'true' | 'false';
}

/**
 * The órdenes de producción list filters, exactly the tri-state/range params
 * `GET /production-orders` documents. Held as ONE object so the whole set
 * flows through `useEntityList.setFilters`, which resets the page — filters
 * kept as separate `useState` silently refetched page N with a narrower set.
 *
 * A `type` and not an `interface` on purpose: only a type alias gets the
 * implicit index signature that makes it assignable to the hook's
 * `Record<string, unknown>` filter slot.
 */
export type ProductionOrderListFilters = {
  schedulingState?: 'enabled' | 'disabled';
  completionState?: 'open' | 'completed';
  voidState?: 'active' | 'voided';
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
};

/** What the "Alta de Pedido" form POSTs / PUTs. `number` is server-generated. */
export interface SalesOrderFormPayload {
  customerUuid?: string;
  productUuid?: string;
  /** The parte path's discriminator; the API derives the cliente from it. */
  partUuid?: string;
  quantity?: number;
  deliveryLocationUuid?: string | null;
  salesUserUuid?: string | null;
  deliveryDate?: string | null;
  purchaseOrder?: string | null;
  supplierCode?: string | null;
  price?: number;
  paid?: number;
  salesSector?: string | null;
  needsAdvanceInvoice?: boolean;
  invoiceSent?: boolean;
  notes?: string | null;
  dispatchNotes?: string | null;
  conversionNotes?: string | null;
}

// ── Órdenes de producción (module 13) ────────────────────────────────────────

/** The three orthogonal lifecycle machines of a production order. */
export type ProductionOrderLifecycleMachine =
  | 'enable'
  | 'disable'
  | 'complete'
  | 'complete/cancel'
  | 'void'
  | 'void/cancel';

/** Nested reference on the API surface: uuid plus a label field or two. */
export interface ProductionOrderRef {
  uuid: string;
  code?: string | null;
  name?: string | null;
  number?: string | null;
  description?: string | null;
}

/** One `CantidadPrometida` row of the generate dialog. */
export interface PromisedQuantityRow {
  quantity: number;
  deliveryDate: string | null;
}

/** `GET /production-orders/generation-eligibility` payload. */
export interface GenerationEligibility {
  canGenerate: boolean;
  alreadyHasOrders: boolean;
  blockingReasons: Array<{ code: string; message: string }>;
  /** The pedido is voided: `Sí` must confirm before posting with `force`. */
  requiresForce: boolean;
  oneOrderPerSalesOrder: boolean;
  defaultRow: { quantity: number; deliveryDate: string | null };
}

export interface ProductionOrder {
  uuid: string;
  number: string;
  orderDate?: string | null;
  quantity: number;
  deliveryDate?: string | null;
  notes?: string | null;

  newPlate?: boolean;
  newPlateReady?: boolean;
  newDie?: boolean;
  newDieReady?: boolean;
  isSample?: boolean;
  dispatchable?: boolean | null;

  // The three lifecycle machines, as the API returns them (ISO strings).
  schedulingApprovedAt?: string | null;
  schedulingApprovedByUser?: string | null;
  schedulingCancelledAt?: string | null;
  schedulingCancelledByUser?: string | null;
  completedAt?: string | null;
  completedByUser?: string | null;
  completionCancelledAt?: string | null;
  completionCancelledByUser?: string | null;
  voidedAt?: string | null;
  voidedByUser?: string | null;
  voidCancelledAt?: string | null;
  voidCancelledByUser?: string | null;

  createdAt?: string;
  createdByUser?: string | null;
  updatedAt?: string | null;

  part?: ProductionOrderRef | null;
  product?: ProductionOrderRef | null;
  customer?: ProductionOrderRef | null;
  orderData?: ProductionOrderRef | null;
  salesOrder?: ProductionOrderRef | null;
  route?: ProductionOrderRef | null;
  palletization?: ProductionOrderRef | null;

  // Derived server-side, never stored.
  habilitada?: boolean;
  cumplida?: boolean;
  anulada?: boolean;
  clisePendiente?: boolean;
  troquelPendiente?: boolean;
}

/** What the manual create/edit path sends. `number` is server-generated. */
export interface ProductionOrderFormPayload {
  partUuid?: string;
  salesOrderUuid?: string | null;
  orderDataUuid?: string | null;
  routeUuid?: string | null;
  palletizationUuid?: string | null;
  quantity?: number;
  deliveryDate?: string | null;
  orderDate?: string | null;
  notes?: string | null;
}
