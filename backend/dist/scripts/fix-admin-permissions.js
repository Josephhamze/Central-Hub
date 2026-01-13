"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔧 Fixing admin permissions...\n');
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        include: {
            roles: {
                include: {
                    role: true,
                },
            },
        },
    });
    if (!adminUser) {
        console.error('❌ Admin user not found! Please run the seed script first.');
        process.exit(1);
    }
    console.log(`✅ Found admin user: ${adminUser.email}`);
    let adminRole = await prisma.role.findUnique({
        where: { name: 'Administrator' },
    });
    if (!adminRole) {
        console.log('📝 Creating Administrator role...');
        adminRole = await prisma.role.create({
            data: {
                name: 'Administrator',
                description: 'Full system access with all permissions',
                isSystem: true,
            },
        });
        console.log('✅ Created Administrator role');
    }
    else {
        console.log('✅ Found Administrator role');
    }
    const hasAdminRole = adminUser.roles.some((ur) => ur.role.name === 'Administrator');
    if (!hasAdminRole) {
        console.log('📝 Assigning Administrator role to admin user...');
        await prisma.userRole.create({
            data: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        });
        console.log('✅ Assigned Administrator role to admin user');
    }
    else {
        console.log('✅ Admin user already has Administrator role');
    }
    const allPermissions = await prisma.permission.findMany();
    console.log(`\n📋 Found ${allPermissions.length} permissions`);
    console.log('🔗 Assigning all permissions to Administrator role...');
    let assignedCount = 0;
    let skippedCount = 0;
    for (const perm of allPermissions) {
        const existing = await prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: perm.id,
                },
            },
        });
        if (!existing) {
            await prisma.rolePermission.create({
                data: {
                    roleId: adminRole.id,
                    permissionId: perm.id,
                },
            });
            assignedCount++;
        }
        else {
            skippedCount++;
        }
    }
    console.log(`✅ Assigned ${assignedCount} new permissions`);
    console.log(`ℹ️  Skipped ${skippedCount} existing permissions`);
    const adminPermissions = await prisma.rolePermission.findMany({
        where: { roleId: adminRole.id },
        include: { permission: true },
    });
    console.log(`\n✅ Administrator role now has ${adminPermissions.length} permissions`);
    console.log('\n📋 All permissions assigned to Administrator:');
    adminPermissions.forEach((rp) => {
        console.log(`   - ${rp.permission.code}`);
    });
    console.log('\n🎉 Admin permissions fixed!');
    console.log('\n⚠️  Note: You may need to log out and log back in for changes to take effect.');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=fix-admin-permissions.js.map