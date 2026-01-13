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
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('quarry-production/product-types')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @Permissions('quarry:settings:manage')
  create(@Body() createDto: CreateProductTypeDto) {
    return this.productTypesService.create(createDto);
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
    return this.productTypesService.findAll(page, limit, search, isActiveBool);
  }

  @Get(':id')
  @Permissions('quarry:settings:view')
  findOne(@Param('id') id: string) {
    return this.productTypesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:settings:manage')
  update(@Param('id') id: string, @Body() updateDto: UpdateProductTypeDto) {
    return this.productTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('quarry:settings:manage')
  remove(@Param('id') id: string) {
    return this.productTypesService.remove(id);
  }
}
