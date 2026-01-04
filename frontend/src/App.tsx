import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { AppLayout } from '@components/layout/AppLayout';
import { ProtectedRoute } from '@components/common/ProtectedRoute';

// Pages
import { LoginPage } from '@pages/auth/LoginPage';
import { RegisterPage } from '@pages/auth/RegisterPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { AdministrationPage } from '@pages/administration/AdministrationPage';
import { InviteCodesPage } from '@pages/administration/InviteCodesPage';
import { OperationsPage } from '@pages/operations/OperationsPage';
import { ProductionPage } from '@pages/production/ProductionPage';
import { CostingPage } from '@pages/costing/CostingPage';
import { InventoryPage } from '@pages/inventory/InventoryPage';
import { AssetsPage } from '@pages/assets/AssetsPage';
import { LogisticsPage } from '@pages/logistics/LogisticsPage';
import { CustomersPage } from '@pages/customers/CustomersPage';
import { ReportingPage } from '@pages/reporting/ReportingPage';
import { ProfilePage } from '@pages/profile/ProfilePage';
import { NotFoundPage } from '@pages/NotFoundPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-content-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="administration" element={<AdministrationPage />}>
          <Route path="invite-codes" element={<InviteCodesPage />} />
        </Route>
        <Route path="operations/*" element={<OperationsPage />} />
        <Route path="production/*" element={<ProductionPage />} />
        <Route path="costing/*" element={<CostingPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="assets/*" element={<AssetsPage />} />
        <Route path="logistics/*" element={<LogisticsPage />} />
        <Route path="customers/*" element={<CustomersPage />} />
        <Route path="reporting/*" element={<ReportingPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;


