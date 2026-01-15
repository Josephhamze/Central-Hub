// Permission configuration for route-based access control
// Maps routes/modules to their required permissions

export const PERMISSIONS = {
  // Administration
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',

  // Companies & Projects
  COMPANIES_VIEW: 'companies:view',
  COMPANIES_CREATE: 'companies:create',
  COMPANIES_UPDATE: 'companies:update',
  COMPANIES_DELETE: 'companies:delete',
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',

  // Quotes/Sales
  QUOTES_VIEW: 'quotes:view',
  QUOTES_CREATE: 'quotes:create',
  QUOTES_UPDATE: 'quotes:update',
  QUOTES_DELETE: 'quotes:delete',
  QUOTES_SUBMIT: 'quotes:submit',
  QUOTES_APPROVE: 'quotes:approve',
  QUOTES_REJECT: 'quotes:reject',

  // Customers & Contacts
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CONTACTS_VIEW: 'contacts:view',
  CONTACTS_CREATE: 'contacts:create',
  CONTACTS_UPDATE: 'contacts:update',
  CONTACTS_DELETE: 'contacts:delete',

  // Logistics
  LOGISTICS_ROUTES_VIEW: 'logistics:routes:view',
  LOGISTICS_ROUTES_CREATE: 'logistics:routes:create',
  LOGISTICS_ROUTES_UPDATE: 'logistics:routes:update',
  LOGISTICS_TOLLS_VIEW: 'logistics:tolls:view',
  LOGISTICS_TOLL_PAYMENTS_VIEW: 'logistics:toll_payments:view',
  LOGISTICS_TOLL_PAYMENTS_CREATE: 'logistics:toll_payments:create',
  LOGISTICS_COSTING_VIEW: 'logistics:costing:view',

  // Inventory
  WAREHOUSES_VIEW: 'warehouses:view',
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_UPDATE: 'warehouses:update',
  WAREHOUSES_DELETE: 'warehouses:delete',
  STOCK_VIEW: 'stock:view',
  STOCK_CREATE: 'stock:create',
  STOCK_UPDATE: 'stock:update',
  STOCK_DELETE: 'stock:delete',

  // Assets
  ASSETS_VIEW: 'assets:view',
  ASSETS_CREATE: 'assets:create',
  ASSETS_UPDATE: 'assets:update',
  WORKORDERS_VIEW: 'workorders:view',
  WORKORDERS_CREATE: 'workorders:create',
  WORKORDERS_UPDATE: 'workorders:update',
  MAINTENANCE_VIEW: 'maintenance:view',
  DEPRECIATION_VIEW: 'depreciation:view',
  PARTS_VIEW: 'parts:view',

  // Quarry Production
  QUARRY_DASHBOARD_VIEW: 'quarry:dashboard:view',
  QUARRY_EQUIPMENT_VIEW: 'quarry:equipment:view',
  QUARRY_SETTINGS_VIEW: 'quarry:settings:view',
  QUARRY_STOCK_VIEW: 'quarry:stock:view',
  QUARRY_EXCAVATOR_VIEW: 'quarry:excavator:view',
  QUARRY_EXCAVATOR_CREATE: 'quarry:excavator:create',
  QUARRY_HAULING_VIEW: 'quarry:hauling:view',
  QUARRY_HAULING_CREATE: 'quarry:hauling:create',
  QUARRY_CRUSHER_FEED_VIEW: 'quarry:crusher-feed:view',
  QUARRY_CRUSHER_FEED_CREATE: 'quarry:crusher-feed:create',
  QUARRY_CRUSHER_OUTPUT_VIEW: 'quarry:crusher-output:view',
  QUARRY_CRUSHER_OUTPUT_CREATE: 'quarry:crusher-output:create',

  // Reporting
  REPORTING_VIEW_SALES_KPIS: 'reporting:view_sales_kpis',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
} as const;

// Module-level permissions for sidebar navigation
export const MODULE_PERMISSIONS = {
  dashboard: [PERMISSIONS.DASHBOARD_VIEW],
  administration: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW],
  operationsProduction: [PERMISSIONS.QUOTES_VIEW, PERMISSIONS.LOGISTICS_ROUTES_VIEW],
  financeReporting: [PERMISSIONS.REPORTING_VIEW_SALES_KPIS],
  inventoryAssets: [PERMISSIONS.WAREHOUSES_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.ASSETS_VIEW],
  logistics: [PERMISSIONS.LOGISTICS_ROUTES_VIEW, PERMISSIONS.LOGISTICS_TOLLS_VIEW, PERMISSIONS.LOGISTICS_COSTING_VIEW],
  quotes: [PERMISSIONS.QUOTES_VIEW],
  quarryProduction: [PERMISSIONS.QUARRY_DASHBOARD_VIEW],
};

// Helper to check if user has any of the required permissions
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p));
}

// Helper to check if user has all required permissions
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p));
}
