import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaterialTypesService } from './material-types.service';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('quarry-production/material-types')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MaterialTypesController {
  constructor(private readonly materialTypesService: MaterialTypesService) {}

  @Post()
  @Permissions('quarry:settings:manage')
  create(@Body() createMaterialTypeDto: CreateMaterialTypeDto) {
    return this.materialTypesService.create(createMaterialTypeDto);
  }

  @Get()
  @Permissions('quarry:settings:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.materialTypesService.findAll(page, limit, search, isActiveBool);
  }

  @Get(':id')
  @Permissions('quarry:settings:view')
  findOne(@Param('id') id: string) {
    return this.materialTypesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:settings:manage')
  update(@Param('id') id: string, @Body() updateMaterialTypeDto: UpdateMaterialTypeDto) {
    return this.materialTypesService.update(id, updateMaterialTypeDto);
  }

  @Delete(':id')
  @Permissions('quarry:settings:manage')
  remove(@Param('id') id: string) {
    return this.materialTypesService.remove(id);
  }
}
