import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionData {
  @ApiProperty({ description: 'Permission code', example: 'quarry:dashboard:view' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Permission name', example: 'View Quarry Dashboard' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Module name', example: 'quarry' })
  @IsString()
  @IsNotEmpty()
  module: string;
}

export class CreatePermissionsDto {
  @ApiProperty({
    description: 'Array of permissions to create',
    type: [PermissionData],
  })
  @IsArray()
  @ArrayMinSize(1)
  permissions: PermissionData[];
}
