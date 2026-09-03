import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerCategories from './pages/CustomerCategories';
import Customers from './pages/Customers';
import PaperTypes from './pages/PaperTypes';
import FluteTypes from './pages/FluteTypes';
import FlapTypes from './pages/FlapTypes';
import ProductTypes from './pages/ProductTypes';
import BoxTypes from './pages/BoxTypes';
import PaperClasses from './pages/PaperClasses';
import Products from './pages/Products';
import Manufacturers from './pages/Manufacturers';
import Suppliers from './pages/Suppliers';
import Warehouses from './pages/Warehouses';
import PaperSupplies from './pages/PaperSupplies';
import PaperSheets from './pages/PaperSheets';
import CorrugationClasses from './pages/CorrugationClasses';
import Corrugations from './pages/Corrugations';
import Parts from './pages/Parts';
import Models from './pages/Models';
import ProductionOrders from './pages/ProductionOrders';
import SalesOrders from './pages/SalesOrders';
import SalesOrderForm from './pages/SalesOrderForm';
import SalesOrderProductionOrders from './pages/SalesOrderProductionOrders';
import PaperStock from './pages/PaperStock';
import SheetStock from './pages/SheetStock';
import ToolingTypes from './pages/ToolingTypes';
import Toolings from './pages/Toolings';
import ConsumableTypes from './pages/ConsumableTypes';
import ConsumableSupplies from './pages/ConsumableSupplies';
import ToolingStock from './pages/ToolingStock';
import ConsumableStock from './pages/ConsumableStock';
import GlueTypes from './pages/GlueTypes';
import Colors from './pages/Colors';
import ColorTypes from './pages/ColorTypes';
import FscTypes from './pages/FscTypes';
import DeliveryZones from './pages/DeliveryZones';
import FinishedGoods from './pages/FinishedGoods';
import ProductionRoutes from './pages/ProductionRoutes';
import Machines from './pages/Machines';
import MachineTypes from './pages/MachineTypes';
import PalletTypes from './pages/PalletTypes';
import Palletizations from './pages/Palletizations';
import Roles from './pages/Roles';
import StrappingTypes from './pages/StrappingTypes';
import Complements from './pages/Complements';
import TraceTypes from './pages/TraceTypes';
import AuditLogs from './pages/AuditLogs';
import AcceptInvitation from './pages/AcceptInvitation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './i18n/config';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer-categories"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <CustomerCategories />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PaperTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/flute-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <FluteTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/flap-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <FlapTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/product-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ProductTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/box-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <BoxTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-classes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PaperClasses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manufacturers"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Manufacturers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/suppliers"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Suppliers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/warehouses"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Warehouses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/supplies"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PaperSupplies />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-sheets"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PaperSheets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corrugation-classes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <CorrugationClasses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corrugations"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Corrugations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parts"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Parts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/models"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Models />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production-orders"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ProductionOrders />
                </ProtectedRoute>
              }
            />

            {/* Pedidos. /new MUST precede /:uuid or the literal is captured. */}
            <Route
              path="/sales-orders"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <SalesOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-orders/new"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <SalesOrderForm />
                </ProtectedRoute>
              }
            />
            {/* The static tail outranks `/sales-orders/:uuid` in React Router's
                ranking, so the edit route keeps working (L-011). */}
            <Route
              path="/sales-orders/:uuid/production-orders"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <SalesOrderProductionOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-orders/:uuid"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <SalesOrderForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-stock"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PaperStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sheet-stock"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <SheetStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tooling-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ToolingTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/toolings"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Toolings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ConsumableTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-supplies"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ConsumableSupplies />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tooling-stock"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ToolingStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-stock"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ConsumableStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/glue-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <GlueTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/colors"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Colors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/color-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ColorTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fsc-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <FscTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/delivery-zones"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <DeliveryZones />
                </ProtectedRoute>
              }
            />

                        <Route
              path="/production-routes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <ProductionRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machines"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Machines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machine-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <MachineTypes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finished-goods"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <FinishedGoods />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pallet-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <PalletTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/palletizations"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Palletizations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Roles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/strapping-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <StrappingTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complements"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Complements />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trace-types"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <TraceTypes />
                </ProtectedRoute>
              }
            />

            {/* Auditoría. Gated on the permission rather than on a role, so
                this route and the sidebar entry that points at it ask exactly
                the same question (L-011). */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute requiredPermission="audit.read">
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </div>
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
