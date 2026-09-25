import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import ProtectedRoute, { DEVICE_PENDING_PATH } from './components/ProtectedRoute';
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
import CorrugatorPool from './pages/CorrugatorPool';
import CorrugatorPlans from './pages/CorrugatorPlans';
import CorrugatorPlan from './pages/CorrugatorPlan';
import CorrugatorPlanPrint from './pages/CorrugatorPlanPrint';
import MachineTypes from './pages/MachineTypes';
import PalletTypes from './pages/PalletTypes';
import Palletizations from './pages/Palletizations';
import StrappingTypes from './pages/StrappingTypes';
import Complements from './pages/Complements';
import TraceTypes from './pages/TraceTypes';
import AuditLogs from './pages/AuditLogs';
import DevicePending from './pages/DevicePending';
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
                <ProtectedRoute requiredPermission="customer-categories.edit">
                  <CustomerCategories />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute requiredPermission="customers.edit">
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-types"
              element={
                <ProtectedRoute requiredPermission="paper-types.edit">
                  <PaperTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/flute-types"
              element={
                <ProtectedRoute requiredPermission="flute-types.edit">
                  <FluteTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/flap-types"
              element={
                <ProtectedRoute requiredPermission="flap-types.edit">
                  <FlapTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/product-types"
              element={
                <ProtectedRoute requiredPermission="product-types.edit">
                  <ProductTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/box-types"
              element={
                <ProtectedRoute requiredPermission="box-types.edit">
                  <BoxTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-classes"
              element={
                <ProtectedRoute requiredPermission="paper.classes">
                  <PaperClasses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute requiredPermission="products.edit">
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manufacturers"
              element={
                <ProtectedRoute requiredPermission="manufacturers.edit">
                  <Manufacturers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/suppliers"
              element={
                <ProtectedRoute requiredPermission="suppliers.edit">
                  <Suppliers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/warehouses"
              element={
                <ProtectedRoute requiredPermission="warehouses.edit">
                  <Warehouses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/supplies"
              element={
                <ProtectedRoute requiredPermission="supplies.edit">
                  <PaperSupplies />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-sheets"
              element={
                <ProtectedRoute requiredPermission="papers.edit">
                  <PaperSheets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corrugation-classes"
              element={
                <ProtectedRoute requiredPermission="corrugated.classes">
                  <CorrugationClasses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corrugations"
              element={
                <ProtectedRoute requiredPermission="corrugated.edit">
                  <Corrugations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/models"
              element={
                <ProtectedRoute requiredPermission="models.edit">
                  <Models />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production-orders"
              element={
                <ProtectedRoute requiredPermission="production-orders.edit">
                  <ProductionOrders />
                </ProtectedRoute>
              }
            />

            {/* Pedidos. /new MUST precede /:uuid or the literal is captured. */}
            <Route
              path="/sales-orders"
              element={
                <ProtectedRoute requiredPermission="orders.edit">
                  <SalesOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-orders/new"
              element={
                <ProtectedRoute requiredPermission="orders.edit">
                  <SalesOrderForm />
                </ProtectedRoute>
              }
            />
            {/* The static tail outranks `/sales-orders/:uuid` in React Router's
                ranking, so the edit route keeps working (L-011). */}
            <Route
              path="/sales-orders/:uuid/production-orders"
              element={
                <ProtectedRoute requiredPermission="orders.edit">
                  <SalesOrderProductionOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-orders/:uuid"
              element={
                <ProtectedRoute requiredPermission="orders.edit">
                  <SalesOrderForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paper-stock"
              element={
                <ProtectedRoute requiredPermission="paper-stock.edit">
                  <PaperStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sheet-stock"
              element={
                <ProtectedRoute requiredPermission="sheet-stock.edit">
                  <SheetStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tooling-types"
              element={
                <ProtectedRoute requiredPermission="tooling-types.edit">
                  <ToolingTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/toolings"
              element={
                <ProtectedRoute requiredPermission="tooling.edit">
                  <Toolings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-types"
              element={
                <ProtectedRoute requiredPermission="consumable-types.edit">
                  <ConsumableTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-supplies"
              element={
                <ProtectedRoute requiredPermission="consumable-supplies.edit">
                  <ConsumableSupplies />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tooling-stock"
              element={
                <ProtectedRoute requiredPermission="tooling-stock.edit">
                  <ToolingStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consumable-stock"
              element={
                <ProtectedRoute requiredPermission="consumable-stock.edit">
                  <ConsumableStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/glue-types"
              element={
                <ProtectedRoute requiredPermission="glue-types.edit">
                  <GlueTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/colors"
              element={
                <ProtectedRoute requiredPermission="colors.edit">
                  <Colors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/color-types"
              element={
                <ProtectedRoute requiredPermission="color-types.edit">
                  <ColorTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fsc-types"
              element={
                <ProtectedRoute requiredPermission="fsc-types.edit">
                  <FscTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/delivery-zones"
              element={
                <ProtectedRoute requiredPermission="delivery-zones.edit">
                  <DeliveryZones />
                </ProtectedRoute>
              }
            />

            <Route
              path="/production-routes"
              element={
                <ProtectedRoute requiredPermission="routes.edit">
                  <ProductionRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machines"
              element={
                <ProtectedRoute requiredPermission="machines.edit">
                  <Machines />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corrugator-pool"
              element={
                <ProtectedRoute requiredPermission="corrugator.plan">
                  <CorrugatorPool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corrugator-plans"
              element={
                <ProtectedRoute requiredPermission="corrugator.plan">
                  <CorrugatorPlans />
                </ProtectedRoute>
              }
            />
            {/* The print route's static tail must precede the dynamic
                `/corrugator-plans/:uuid` or the literal is captured (L-011,
                same pattern as `/sales-orders/:uuid/production-orders`). */}
            <Route
              path="/corrugator-plans/:uuid/print"
              element={
                <ProtectedRoute requiredPermission="corrugator.plan">
                  <CorrugatorPlanPrint />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corrugator-plans/:uuid"
              element={
                <ProtectedRoute requiredPermission="corrugator.plan">
                  <CorrugatorPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machine-types"
              element={
                <ProtectedRoute requiredPermission="machines.edit">
                  <MachineTypes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finished-goods"
              element={
                <ProtectedRoute requiredPermission="finished-goods.edit">
                  <FinishedGoods />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pallet-types"
              element={
                <ProtectedRoute requiredPermission="palletizing.edit">
                  <PalletTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/palletizations"
              element={
                <ProtectedRoute requiredPermission="palletizing.edit">
                  <Palletizations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/strapping-types"
              element={
                <ProtectedRoute requiredPermission="strapping-types.edit">
                  <StrappingTypes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complements"
              element={
                <ProtectedRoute requiredPermission="complements.edit">
                  <Complements />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trace-types"
              element={
                <ProtectedRoute requiredPermission="score-types.edit">
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

            {/* The waiting screen a device-blocked member is sent to. Authenticated
                but permission-free: it is the one page such a member may render. */}
            <Route
              path={DEVICE_PENDING_PATH}
              element={
                <ProtectedRoute>
                  <DevicePending />
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
