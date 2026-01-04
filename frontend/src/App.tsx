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
import { AssetRegistryPage } from '@pages/assets/AssetRegistryPage';
import { WorkOrdersPage } from '@pages/assets/WorkOrdersPage';
import { MaintenanceSchedulesPage } from '@pages/assets/MaintenanceSchedulesPage';
import { SparePartsPage } from '@pages/assets/SparePartsPage';
import { DepreciationPage } from '@pages/assets/DepreciationPage';
import { LogisticsPage } from '@pages/logistics/LogisticsPage';
import { CustomersPage } from '@pages/customers/CustomersPage';
import { ReportingPage } from '@pages/reporting/ReportingPage';
import { ProfilePage } from '@pages/profile/ProfilePage';
import { NotFoundPage } from '@pages/NotFoundPage';

// Sales Quote System pages
import { QuoteWizardPage } from '@pages/customers/quotes/QuoteWizardPage';
import { QuotesAdminPage } from '@pages/sales/QuotesAdminPage';
import { QuoteDetailPage } from '@pages/sales/QuoteDetailPage';
import { SalesKPIsPage } from '@pages/sales/SalesKPIsPage';
import { CompaniesPage } from '@pages/administration/CompaniesPage';
import { ProjectsPage } from '@pages/administration/ProjectsPage';
import { UsersManagementPage } from '@pages/administration/users/UsersManagementPage';
import { RolesManagementPage } from '@pages/administration/roles/RolesManagementPage';
import { CustomersManagementPage } from '@pages/customers/CustomersManagementPage';
import { ContactsPage } from '@pages/customers/ContactsPage';
import { WarehousesPage } from '@pages/inventory/WarehousesPage';
import { StockItemsPage } from '@pages/inventory/StockItemsPage';
import { RoutesPage } from '@pages/logistics/RoutesPage';
import { OperationsProductionPage } from '@pages/operations-production/OperationsProductionPage';
import { FinanceReportingPage } from '@pages/finance-reporting/FinanceReportingPage';
import { InventoryAssetsPage } from '@pages/inventory-assets/InventoryAssetsPage';


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
        <Route path="administration/users" element={<UsersManagementPage />} />
        <Route path="administration/roles" element={<RolesManagementPage />} />
        <Route path="administration/invite-codes" element={<InviteCodesPage />} />
        <Route path="operations-production" element={<OperationsProductionPage />} />
        <Route path="operations/*" element={<OperationsPage />} />
        <Route path="production/*" element={<ProductionPage />} />
        <Route path="finance-reporting" element={<FinanceReportingPage />} />
        <Route path="costing/*" element={<CostingPage />} />
        <Route path="inventory-assets" element={<InventoryAssetsPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="inventory/warehouses" element={<WarehousesPage />} />
        <Route path="inventory/stock-items" element={<StockItemsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/registry" element={<AssetRegistryPage />} />
        <Route path="assets/:id" element={<AssetRegistryPage />} />
        <Route path="assets/work-orders" element={<WorkOrdersPage />} />
        <Route path="assets/work-orders/:id" element={<AssetRegistryPage />} />
        <Route path="assets/maintenance/schedules" element={<MaintenanceSchedulesPage />} />
        <Route path="assets/parts" element={<SparePartsPage />} />
        <Route path="assets/depreciation" element={<DepreciationPage />} />
        <Route path="logistics/*" element={<LogisticsPage />} />
        <Route path="logistics/routes" element={<RoutesPage />} />
        <Route path="customers/*" element={<CustomersPage />} />
        <Route path="customers/customers" element={<CustomersManagementPage />} />
        <Route path="customers/contacts" element={<ContactsPage />} />
        <Route path="reporting/*" element={<ReportingPage />} />
        <Route path="reporting/sales-kpis" element={<SalesKPIsPage />} />
        <Route path="sales/quotes/new" element={<QuoteWizardPage />} />
        <Route path="sales/quotes/:id/edit" element={<QuoteWizardPage />} />
        <Route path="sales/quotes/:id" element={<QuoteDetailPage />} />
        <Route path="sales/quotes" element={<QuotesAdminPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
