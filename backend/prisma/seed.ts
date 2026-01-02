import { PrismaClient, ThemePreference } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions for each module
  const modules = [
    'dashboard',
    'administration',
    'operations',
    'production',
    'costing',
    'inventory',
    'assets',
    'logistics',
    'customers',
    'reporting',
  ];

  const actions = ['view', 'create', 'update', 'delete'];

  console.log('📋 Creating permissions...');
  const permissions: { code: string; name: string; module: string }[] = [];

  for (const module of modules) {
    for (const action of actions) {
      permissions.push({
        code: `${module}:${action}`,
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
        module,
      });
    }
  }

  // Add system-level permissions

  // Add sales quote system permissions
  permissions.push(
    { code: 'companies:view', name: 'View Companies', module: 'companies' },
    { code: 'companies:create', name: 'Create Companies', module: 'companies' },
    { code: 'companies:update', name: 'Update Companies', module: 'companies' },
    { code: 'companies:delete', name: 'Delete Companies', module: 'companies' },
    { code: 'customers:view', name: 'View Customers', module: 'customers' },
    { code: 'customers:create', name: 'Create Customers', module: 'customers' },
    { code: 'customers:update', name: 'Update Customers', module: 'customers' },
    { code: 'customers:delete', name: 'Delete Customers', module: 'customers' },
    { code: 'contacts:view', name: 'View Contacts', module: 'contacts' },
    { code: 'contacts:create', name: 'Create Contacts', module: 'contacts' },
    { code: 'contacts:update', name: 'Update Contacts', module: 'contacts' },
    { code: 'contacts:delete', name: 'Delete Contacts', module: 'contacts' },
    { code: 'projects:view', name: 'View Projects', module: 'projects' },
    { code: 'projects:create', name: 'Create Projects', module: 'projects' },
    { code: 'projects:update', name: 'Update Projects', module: 'projects' },
    { code: 'projects:delete', name: 'Delete Projects', module: 'projects' },
    { code: 'warehouses:view', name: 'View Warehouses', module: 'warehouses' },
    { code: 'warehouses:create', name: 'Create Warehouses', module: 'warehouses' },
    { code: 'warehouses:update', name: 'Update Warehouses', module: 'warehouses' },
    { code: 'warehouses:delete', name: 'Delete Warehouses', module: 'warehouses' },
    { code: 'stock:view', name: 'View Stock Items', module: 'stock' },
    { code: 'stock:create', name: 'Create Stock Items', module: 'stock' },
    { code: 'stock:update', name: 'Update Stock Items', module: 'stock' },
    { code: 'stock:delete', name: 'Delete Stock Items', module: 'stock' },
    { code: 'routes:view', name: 'View Routes', module: 'routes' },
    { code: 'routes:create', name: 'Create Routes', module: 'routes' },
    { code: 'routes:update', name: 'Update Routes', module: 'routes' },
    { code: 'routes:delete', name: 'Delete Routes', module: 'routes' },
    { code: 'quotes:view', name: 'View Quotes', module: 'quotes' },
    { code: 'quotes:create', name: 'Create Quotes', module: 'quotes' },
    { code: 'quotes:update', name: 'Update Quotes', module: 'quotes' },
    { code: 'quotes:delete', name: 'Delete Quotes', module: 'quotes' },
    { code: 'quotes:submit', name: 'Submit Quotes', module: 'quotes' },
    { code: 'quotes:approve', name: 'Approve Quotes', module: 'quotes' },
    { code: 'quotes:reject', name: 'Reject Quotes', module: 'quotes' },
    { code: 'reporting:view_sales_kpis', name: 'View Sales KPIs', module: 'reporting' },
    { code: 'assets:view', name: 'View Assets', module: 'assets' },
    { code: 'assets:create', name: 'Create Assets', module: 'assets' },
    { code: 'assets:update', name: 'Update Assets', module: 'assets' },
    { code: 'assets:retire', name: 'Retire Assets', module: 'assets' },
    { code: 'maintenance:view', name: 'View Maintenance', module: 'maintenance' },
    { code: 'maintenance:schedule', name: 'Schedule Maintenance', module: 'maintenance' },
    { code: 'maintenance:execute', name: 'Execute Maintenance', module: 'maintenance' },
    { code: 'maintenance:approve', name: 'Approve Maintenance', module: 'maintenance' },
    { code: 'workorders:view', name: 'View Work Orders', module: 'workorders' },
    { code: 'workorders:create', name: 'Create Work Orders', module: 'workorders' },
    { code: 'workorders:update', name: 'Update Work Orders', module: 'workorders' },
    { code: 'workorders:close', name: 'Close Work Orders', module: 'workorders' },
    { code: 'parts:view', name: 'View Parts', module: 'parts' },
    { code: 'parts:manage', name: 'Manage Parts', module: 'parts' },
    { code: 'depreciation:view', name: 'View Depreciation', module: 'depreciation' },
    { code: 'depreciation:manage', name: 'Manage Depreciation', module: 'depreciation' },
);
  permissions.push(
    { code: 'system:manage_users', name: 'Manage Users', module: 'system' },
    { code: 'system:manage_roles', name: 'Manage Roles', module: 'system' },
    { code: 'system:manage_settings', name: 'Manage Settings', module: 'system' },
    { code: 'system:view_audit_logs', name: 'View Audit Logs', module: 'system' },
  );

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        name: perm.name,
        module: perm.module,
        description: `Permission to ${perm.name.toLowerCase()}`,
      },
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles
  console.log('👥 Creating roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Management access with view and update permissions',
      isSystem: true,
    },
  });

  const operatorRole = await prisma.role.upsert({
    where: { name: 'Operator' },
    update: {},
    create: {
      name: 'Operator',
      description: 'Operational access with view permissions',
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access to view data',
      isSystem: true,
    },
  });

  console.log('✅ Created 4 system roles');

  // Assign all permissions to admin role
  console.log('🔗 Assigning permissions to roles...');
  const allPermissions = await prisma.permission.findMany();

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign view permissions to viewer role
  const viewPermissions = allPermissions.filter((p) => p.code.endsWith(':view'));
  for (const perm of viewPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign view + update permissions to manager
  const managerPermissions = allPermissions.filter(
    (p) => p.code.endsWith(':view') || p.code.endsWith(':update'),
  );
  for (const perm of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign view + create + update to operator for operations modules
  const operatorPermissions = allPermissions.filter(
    (p) =>
      (p.code.endsWith(':view') ||
        p.code.endsWith(':create') ||
        p.code.endsWith(':update')) &&
      ['operations', 'production', 'inventory', 'logistics', 'quotes'].includes(p.module),
  );
  for (const perm of operatorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: operatorRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: operatorRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // Create admin user
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      themePreference: ThemePreference.SYSTEM,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Created admin user');

  // Assign Administrator role to jj@efertongroup.com if user exists
  const additionalAdmin = await prisma.user.findUnique({
    where: { email: 'jj@efertongroup.com' },
  });

  if (additionalAdmin) {
    const hasAdminRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: additionalAdmin.id,
          roleId: adminRole.id,
        },
      },
    });

    if (!hasAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: additionalAdmin.id,
          roleId: adminRole.id,
        },
      });
      console.log('✅ Assigned Administrator role to jj@efertongroup.com');
    } else {
      console.log('ℹ️  jj@efertongroup.com already has Administrator role');
    }
  } else {
    console.log('ℹ️  User jj@efertongroup.com not found (will be assigned on next seed if user exists)');
  }

  // Create default system settings
  console.log('⚙️ Creating system settings...');
  const defaultSettings = [
    {
      key: 'app.name',
      value: JSON.stringify('Operations Control Panel'),
      category: 'general',
    },
    {
      key: 'app.timezone',
      value: JSON.stringify('UTC'),
      category: 'general',
    },
    {
      key: 'app.date_format',
      value: JSON.stringify('YYYY-MM-DD'),
      category: 'general',
    },
    {
      key: 'app.currency',
      value: JSON.stringify('USD'),
      category: 'general',
    },
    {
      key: 'session.timeout_minutes',
      value: JSON.stringify(30),
      category: 'security',
    },
    {
      key: 'password.min_length',
      value: JSON.stringify(8),
      category: 'security',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Created system settings');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
