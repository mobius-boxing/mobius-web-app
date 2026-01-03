import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Companies from './pages/Companies';
import CustomerCategories from './pages/CustomerCategories';
import Customers from './pages/Customers';
import PaperTypes from './pages/PaperTypes';
import FluteTypes from './pages/FluteTypes';
import PaperClasses from './pages/PaperClasses';
import Products from './pages/Products';
import Manufacturers from './pages/Manufacturers';
import Suppliers from './pages/Suppliers';
import Warehouses from './pages/Warehouses';
import PaperSupplies from './pages/PaperSupplies';
import PaperSheets from './pages/PaperSheets';
import CorrugationClasses from './pages/CorrugationClasses';
import Corrugations from './pages/Corrugations';
import PaperStock from './pages/PaperStock';
import SheetStock from './pages/SheetStock';
import AcceptInvitation from './pages/AcceptInvitation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './i18n/config';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['admin', 'superAdmin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute requiredRoles={['superAdmin']}>
                  <Companies />
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

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
