import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const InboundPage = React.lazy(() => import('./pages/InboundPage'));
const OutboundPage = React.lazy(() => import('./pages/OutboundPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));

// Keep legacy StockManagementPage route for backward-compat redirect
const StockManagementPage = React.lazy(() => import('./pages/StockManagementPage'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={
          <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
              <Route path="/products" element={<DashboardLayout><ProductsPage /></DashboardLayout>} />
              <Route path="/inbound" element={<DashboardLayout><InboundPage /></DashboardLayout>} />
              <Route path="/outbound" element={<DashboardLayout><OutboundPage /></DashboardLayout>} />
              <Route path="/reports" element={<DashboardLayout><ReportsPage /></DashboardLayout>} />
              {/* Legacy redirect */}
              <Route path="/stock" element={<DashboardLayout><StockManagementPage /></DashboardLayout>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
