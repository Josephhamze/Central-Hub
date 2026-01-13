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
import { ExcavatorsService } from './excavators.service';
import { CreateExcavatorDto } from './dto/create-excavator.dto';
import { UpdateExcavatorDto } from './dto/update-excavator.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('quarry-production/excavators')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExcavatorsController {
  constructor(private readonly excavatorsService: ExcavatorsService) {}

  @Post()
  @Permissions('quarry:equipment:manage')
  create(@Body() createExcavatorDto: CreateExcavatorDto) {
    return this.excavatorsService.create(createExcavatorDto);
  }

  @Get()
  @Permissions('quarry:equipment:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.excavatorsService.findAll(page, limit, search, status as any);
  }

  @Get(':id')
  @Permissions('quarry:equipment:view')
  findOne(@Param('id') id: string) {
    return this.excavatorsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:equipment:manage')
  update(@Param('id') id: string, @Body() updateExcavatorDto: UpdateExcavatorDto) {
    return this.excavatorsService.update(id, updateExcavatorDto);
  }

  @Delete(':id')
  @Permissions('quarry:equipment:manage')
  remove(@Param('id') id: string) {
    return this.excavatorsService.remove(id);
  }
}
