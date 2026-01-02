import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Contacts')
@ApiBearerAuth('JWT-auth')
@Controller('contacts')
@UseInterceptors(ResponseInterceptor)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('contacts:view')
  @ApiOperation({ summary: 'Get all contacts' })
  async findAll(@Query('customerId') customerId?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.contactsService.findAll(customerId, +page, +limit);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('contacts:view')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('contacts:create')
  @ApiOperation({ summary: 'Create a new contact' })
  async create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('contacts:update')
  @ApiOperation({ summary: 'Update a contact' })
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('contacts:delete')
  @ApiOperation({ summary: 'Delete a contact' })
  async remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
