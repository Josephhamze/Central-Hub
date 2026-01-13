import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Granting Quarry Production permissions...');

  // Find the user by email
  const userEmail = process.argv[2] || 'jj@efertongroup.com';
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    console.error(`❌ User with email ${userEmail} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

  // Find or get Administrator role
  let adminRole = await prisma.role.findUnique({
    where: { name: 'Administrator' },
  });

  if (!adminRole) {
    console.log('⚠️  Administrator role not found. Creating it...');
    adminRole = await prisma.role.create({
      data: {
        name: 'Administrator',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
    });
  }

  // Check if user already has Administrator role
  const hasAdminRole = user.roles.some((ur) => ur.role.name === 'Administrator');

  if (hasAdminRole) {
    console.log('✅ User already has Administrator role');
  } else {
    // Assign Administrator role to user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
    console.log('✅ Assigned Administrator role to user');
  }

  // Also ensure all quarry permissions exist and are assigned to Administrator role
  const quarryPermissions = [
    'quarry:dashboard:view',
    'quarry:equipment:view',
    'quarry:equipment:manage',
    'quarry:settings:view',
    'quarry:settings:manage',
    'quarry:excavator-entries:view',
    'quarry:excavator-entries:create',
    'quarry:excavator-entries:update',
    'quarry:excavator-entries:delete',
    'quarry:excavator-entries:approve',
    'quarry:hauling-entries:view',
    'quarry:hauling-entries:create',
    'quarry:hauling-entries:update',
    'quarry:hauling-entries:delete',
    'quarry:hauling-entries:approve',
    'quarry:crusher-feed:view',
    'quarry:crusher-feed:create',
    'quarry:crusher-feed:update',
    'quarry:crusher-feed:delete',
    'quarry:crusher-feed:approve',
    'quarry:crusher-output:view',
    'quarry:crusher-output:create',
    'quarry:crusher-output:update',
    'quarry:crusher-output:delete',
    'quarry:crusher-output:approve',
    'quarry:stock:view',
    'quarry:stock:adjust',
  ];

  console.log('🔗 Ensuring all quarry permissions are assigned to Administrator role...');
  for (const permCode of quarryPermissions) {
    let permission = await prisma.permission.findUnique({
      where: { code: permCode },
    });

    if (!permission) {
      console.log(`⚠️  Permission ${permCode} not found. Creating it...`);
      permission = await prisma.permission.create({
        data: {
          code: permCode,
          name: permCode.replace(/:|_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          module: 'quarry',
          description: `Permission for ${permCode}`,
        },
      });
    }

    // Ensure permission is assigned to Administrator role
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ All quarry permissions assigned to Administrator role');
  console.log('🎉 Done! User should now have access to Quarry Production.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
