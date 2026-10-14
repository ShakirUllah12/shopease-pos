import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Receipts from './pages/Receipts';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import BarcodeGenerator from './pages/BarcodeGenerator';
import Shifts from './pages/Shifts';
import Storefront from './pages/Storefront';

/**
 * Route protection wrapper
 */
function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, loading, isOwner } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (ownerOnly && !isOwner) {
    return <Navigate to="/pos" replace />;
  }

  return <Layout>{children}</Layout>;
}

/**
 * Public route protection (redirects to /pos if already signed in)
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/pos" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public Auth Route */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Public Storefront Website (accessible by customers without login) */}
              <Route path="/store" element={<Storefront />} />

              {/* Core POS & Staff Routes */}
              <Route
                path="/pos"
                element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shifts"
                element={
                  <ProtectedRoute>
                    <Shifts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/barcode-generator"
                element={
                  <ProtectedRoute>
                    <BarcodeGenerator />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/receipts"
                element={
                  <ProtectedRoute>
                    <Receipts />
                  </ProtectedRoute>
                }
              />

              {/* Owner Protected Administrative Routes */}
              <Route
                path="/products"
                element={
                  <ProtectedRoute ownerOnly>
                    <Products />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/categories"
                element={
                  <ProtectedRoute ownerOnly>
                    <Categories />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock"
                element={
                  <ProtectedRoute ownerOnly>
                    <Stock />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/purchases"
                element={
                  <ProtectedRoute ownerOnly>
                    <Purchases />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/expenses"
                element={
                  <ProtectedRoute ownerOnly>
                    <Expenses />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute ownerOnly>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute ownerOnly>
                    <Users />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute ownerOnly>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/pos" replace />} />
              <Route path="*" element={<Navigate to="/pos" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
