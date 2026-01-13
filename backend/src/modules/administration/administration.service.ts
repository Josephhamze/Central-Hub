import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePermissionsDto } from './dto/create-permissions.dto';

@Injectable()
export class AdministrationService {
  constructor(private prisma: PrismaService) {}

  async createPermissions(dto: CreatePermissionsDto) {
    const results = {
      created: [] as string[],
      existing: [] as string[],
      errors: [] as string[],
    };

    for (const perm of dto.permissions) {
      try {
        const existing = await this.prisma.permission.findUnique({
          where: { code: perm.code },
        });

        if (existing) {
          results.existing.push(perm.code);
        } else {
          await this.prisma.permission.create({
            data: {
              code: perm.code,
              name: perm.name,
              module: perm.module,
              description: `Permission to ${perm.name.toLowerCase()}`,
            },
          });
          results.created.push(perm.code);
        }
      } catch (error: any) {
        results.errors.push(`${perm.code}: ${error.message}`);
      }
    }

    // Assign all created permissions to Administrator role
    if (results.created.length > 0) {
      const adminRole = await this.prisma.role.findUnique({
        where: { name: 'Administrator' },
      });

      if (adminRole) {
        for (const code of results.created) {
          const permission = await this.prisma.permission.findUnique({
            where: { code },
          });

          if (permission) {
            await this.prisma.rolePermission.upsert({
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
        }
      }
    }

    return results;
  }

  async createQuarryPermissions() {
    const quarryPermissions = [
      // Equipment
      { code: 'quarry:equipment:view', name: 'View Quarry Equipment', module: 'quarry' },
      { code: 'quarry:equipment:manage', name: 'Manage Quarry Equipment', module: 'quarry' },
      // Settings
      { code: 'quarry:settings:view', name: 'View Quarry Settings', module: 'quarry' },
      { code: 'quarry:settings:manage', name: 'Manage Quarry Settings', module: 'quarry' },
      // Excavator Entries
      { code: 'quarry:excavator-entries:view', name: 'View Excavator Entries', module: 'quarry' },
      { code: 'quarry:excavator-entries:create', name: 'Create Excavator Entries', module: 'quarry' },
      { code: 'quarry:excavator-entries:update', name: 'Update Excavator Entries', module: 'quarry' },
      { code: 'quarry:excavator-entries:delete', name: 'Delete Excavator Entries', module: 'quarry' },
      { code: 'quarry:excavator-entries:approve', name: 'Approve Excavator Entries', module: 'quarry' },
      // Hauling Entries
      { code: 'quarry:hauling-entries:view', name: 'View Hauling Entries', module: 'quarry' },
      { code: 'quarry:hauling-entries:create', name: 'Create Hauling Entries', module: 'quarry' },
      { code: 'quarry:hauling-entries:update', name: 'Update Hauling Entries', module: 'quarry' },
      { code: 'quarry:hauling-entries:delete', name: 'Delete Hauling Entries', module: 'quarry' },
      { code: 'quarry:hauling-entries:approve', name: 'Approve Hauling Entries', module: 'quarry' },
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

    return this.createPermissions({ permissions: quarryPermissions });
  }
}
