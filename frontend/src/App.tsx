import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { AppLayout } from '@components/layout/AppLayout';
import { ProtectedRoute } from '@components/common/ProtectedRoute';

// Pages
import { LoginPage } from '@pages/auth/LoginPage';
import { RegisterPage } from '@pages/auth/RegisterPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { AdministrationPage } from '@pages/administration/AdministrationPage';
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

// Sales Quote System pages
import { QuoteWizardPage } from '@pages/customers/quotes/QuoteWizardPage';
import { QuotesAdminPage } from '@pages/sales/QuotesAdminPage';
import { SalesKPIsPage } from '@pages/sales/SalesKPIsPage';
import { CompaniesPage } from '@pages/administration/CompaniesPage';
import { ProjectsPage } from '@pages/administration/ProjectsPage';
import { CustomersManagementPage } from '@pages/customers/CustomersManagementPage';
import { ContactsPage } from '@pages/customers/ContactsPage';
import { WarehousesPage } from '@pages/inventory/WarehousesPage';
import { StockItemsPage } from '@pages/inventory/StockItemsPage';
import { RoutesPage } from '@pages/logistics/RoutesPage';

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
        <Route path="administration/*" element={<AdministrationPage />} />
        <Route path="administration/companies" element={<CompaniesPage />} />
        <Route path="administration/projects" element={<ProjectsPage />} />
        <Route path="operations/*" element={<OperationsPage />} />
        <Route path="production/*" element={<ProductionPage />} />
        <Route path="costing/*" element={<CostingPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="inventory/warehouses" element={<WarehousesPage />} />
        <Route path="inventory/stock-items" element={<StockItemsPage />} />
        <Route path="assets/*" element={<AssetsPage />} />
        <Route path="logistics/*" element={<LogisticsPage />} />
        <Route path="logistics/routes" element={<RoutesPage />} />
        <Route path="customers/*" element={<CustomersPage />} />
        <Route path="customers/customers" element={<CustomersManagementPage />} />
        <Route path="customers/contacts" element={<ContactsPage />} />
        <Route path="reporting/*" element={<ReportingPage />} />
        <Route path="reporting/sales-kpis" element={<SalesKPIsPage />} />
        <Route path="sales/quotes/new" element={<QuoteWizardPage />} />
        <Route path="sales/quotes" element={<QuotesAdminPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
