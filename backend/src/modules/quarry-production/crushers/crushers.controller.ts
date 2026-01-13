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
import { CrushersService } from './crushers.service';
import { CreateCrusherDto } from './dto/create-crusher.dto';
import { UpdateCrusherDto } from './dto/update-crusher.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('api/v1/quarry-production/crushers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrushersController {
  constructor(private readonly crushersService: CrushersService) {}

  @Post()
  @Permissions('quarry:equipment:manage')
  create(@Body() createCrusherDto: CreateCrusherDto) {
    return this.crushersService.create(createCrusherDto);
  }

  @Get()
  @Permissions('quarry:equipment:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.crushersService.findAll(page, limit, search, status as any);
  }

  @Get(':id')
  @Permissions('quarry:equipment:view')
  findOne(@Param('id') id: string) {
    return this.crushersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:equipment:manage')
  update(@Param('id') id: string, @Body() updateCrusherDto: UpdateCrusherDto) {
    return this.crushersService.update(id, updateCrusherDto);
  }

  @Delete(':id')
  @Permissions('quarry:equipment:manage')
  remove(@Param('id') id: string) {
    return this.crushersService.remove(id);
  }
}
