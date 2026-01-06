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
  permissions.push(
    { code: 'system:manage_users', name: 'Manage Users', module: 'system' },
    { code: 'system:manage_roles', name: 'Manage Roles', module: 'system' },
    { code: 'system:manage_settings', name: 'Manage Settings', module: 'system' },
    { code: 'system:view_audit_logs', name: 'View Audit Logs', module: 'system' },
  );

  // Add specific logistics permissions for Routes & Tolls system
  permissions.push(
    { code: 'logistics:routes:view', name: 'View Routes', module: 'logistics' },
    { code: 'logistics:routes:manage', name: 'Manage Routes', module: 'logistics' },
    { code: 'logistics:tolls:view', name: 'View Tolls', module: 'logistics' },
    { code: 'logistics:tolls:manage', name: 'Manage Tolls', module: 'logistics' },
    { code: 'logistics:costing:view', name: 'View Costing', module: 'logistics' },
    { code: 'logistics:costing:manage', name: 'Manage Costing', module: 'logistics' },
    { code: 'logistics:toll_payments:view', name: 'View Toll Payments', module: 'logistics' },
    { code: 'logistics:toll_payments:create', name: 'Create Toll Payments', module: 'logistics' },
    { code: 'logistics:toll_payments:approve', name: 'Approve Toll Payments', module: 'logistics' },
    { code: 'logistics:toll_payments:post', name: 'Post Toll Payments', module: 'logistics' },
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
      ['operations', 'production', 'inventory', 'logistics'].includes(p.module),
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

  console.log('✅ Created admin user (admin@example.com / Admin123!)');

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


