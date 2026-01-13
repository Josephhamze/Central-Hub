/**
 * Create Quarry Permissions Script
 * 
 * This script ensures all quarry production permissions exist in the database.
 * Run this if quarry permissions are missing from the roles management page.
 * 
 * Usage: pnpm ts-node scripts/create-quarry-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating quarry production permissions...\n');

  // Define all quarry permissions
  const quarryPermissions = [
    // Equipment
    { code: 'quarry:equipment:view', name: 'View Quarry Equipment', module: 'quarry' },
    { code: 'quarry:equipment:manage', name: 'Manage Quarry Equipment', module: 'quarry' },
    // Settings
    { code: 'quarry:settings:view', name: 'View Quarry Settings', module: 'quarry' },
    { code: 'quarry:settings:manage', name: 'Manage Quarry Settings', module: 'quarry' },
    // Excavator Entries
    { code: 'quarry:excavator:view', name: 'View Excavator Entries', module: 'quarry' },
    { code: 'quarry:excavator:create', name: 'Create Excavator Entries', module: 'quarry' },
    { code: 'quarry:excavator:update', name: 'Update Excavator Entries', module: 'quarry' },
    { code: 'quarry:excavator:delete', name: 'Delete Excavator Entries', module: 'quarry' },
    { code: 'quarry:excavator:approve', name: 'Approve Excavator Entries', module: 'quarry' },
    // Hauling Entries
    { code: 'quarry:hauling:view', name: 'View Hauling Entries', module: 'quarry' },
    { code: 'quarry:hauling:create', name: 'Create Hauling Entries', module: 'quarry' },
    { code: 'quarry:hauling:update', name: 'Update Hauling Entries', module: 'quarry' },
    { code: 'quarry:hauling:delete', name: 'Delete Hauling Entries', module: 'quarry' },
    { code: 'quarry:hauling:approve', name: 'Approve Hauling Entries', module: 'quarry' },
    // Crusher Feed Entries
    { code: 'quarry:crusher-feed:view', name: 'View Crusher Feed Entries', module: 'quarry' },
    { code: 'quarry:crusher-feed:create', name: 'Create Crusher Feed Entries', module: 'quarry' },
    { code: 'quarry:crusher-feed:update', name: 'Update Crusher Feed Entries', module: 'quarry' },
    { code: 'quarry:crusher-feed:delete', name: 'Delete Crusher Feed Entries', module: 'quarry' },
    { code: 'quarry:crusher-feed:approve', name: 'Approve Crusher Feed Entries', module: 'quarry' },
    // Crusher Output Entries
    { code: 'quarry:crusher-output:view', name: 'View Crusher Output Entries', module: 'quarry' },
    { code: 'quarry:crusher-output:create', name: 'Create Crusher Output Entries', module: 'quarry' },
    { code: 'quarry:crusher-output:update', name: 'Update Crusher Output Entries', module: 'quarry' },
    { code: 'quarry:crusher-output:delete', name: 'Delete Crusher Output Entries', module: 'quarry' },
    { code: 'quarry:crusher-output:approve', name: 'Approve Crusher Output Entries', module: 'quarry' },
    // Stock
    { code: 'quarry:stock:view', name: 'View Stock Levels', module: 'quarry' },
    { code: 'quarry:stock:adjust', name: 'Adjust Stock Levels', module: 'quarry' },
    // Dashboard
    { code: 'quarry:dashboard:view', name: 'View Quarry Dashboard', module: 'quarry' },
  ];

  let createdCount = 0;
  let existingCount = 0;

  console.log(`📋 Processing ${quarryPermissions.length} quarry permissions...\n`);

  for (const perm of quarryPermissions) {
    const existing = await prisma.permission.findUnique({
      where: { code: perm.code },
    });

    if (existing) {
      console.log(`ℹ️  Permission already exists: ${perm.code}`);
      existingCount++;
    } else {
      await prisma.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          module: perm.module,
          description: `Permission to ${perm.name.toLowerCase()}`,
        },
      });
      console.log(`✅ Created permission: ${perm.code}`);
      createdCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ℹ️  Already existed: ${existingCount}`);
  console.log(`   📋 Total: ${quarryPermissions.length}`);

  // Now ensure Administrator role has all these permissions
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Administrator' },
  });

  if (adminRole) {
    console.log(`\n🔗 Assigning permissions to Administrator role...`);
    let assignedCount = 0;
    let skippedCount = 0;

    for (const perm of quarryPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: perm.code },
      });

      if (permission) {
        const existing = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
          assignedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    console.log(`   ✅ Assigned ${assignedCount} new permissions`);
    console.log(`   ℹ️  Skipped ${skippedCount} existing permissions`);
  } else {
    console.log(`\n⚠️  Administrator role not found. Permissions created but not assigned.`);
  }

  console.log('\n🎉 Quarry permissions created successfully!');
  console.log('\n⚠️  Note: Refresh the roles management page to see the new permissions.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
