import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { RejectQuoteDto } from './dto/reject-quote.dto';
import { QuoteOutcomeDto } from './dto/quote-outcome.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuoteStatus } from '@prisma/client';

@ApiTags('Quotes')
@ApiBearerAuth('JWT-auth')
@Controller('quotes')
@UseInterceptors(ResponseInterceptor)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('quotes:view')
  @ApiOperation({ summary: 'Get all quotes' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
    @Query('status') status?: QuoteStatus,
    @Query('companyId') companyId?: string,
    @Query('projectId') projectId?: string,
    @Query('salesRepUserId') salesRepUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.quotesService.findAll(
      userId,
      userPermissions,
      {
        status,
        companyId,
        projectId,
        salesRepUserId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      +page,
      +limit,
    );
  }

  @Get('kpis')
  @UseGuards(RbacGuard)
  @Permissions('reporting:view_sales_kpis')
  @ApiOperation({ summary: 'Get sales KPIs' })
  async getKPIs(
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
    @Query('companyId') companyId?: string,
    @Query('projectId') projectId?: string,
    @Query('salesRepUserId') salesRepUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.quotesService.getSalesKPIs(userId, userPermissions, {
      companyId,
      projectId,
      salesRepUserId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('quotes:view')
  @ApiOperation({ summary: 'Get quote by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.findOne(id, userId, userPermissions);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('quotes:create')
  @ApiOperation({ summary: 'Create a new quote' })
  async create(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.quotesService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('quotes:update')
  @ApiOperation({ summary: 'Update a quote' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.update(id, dto, userId, userPermissions);
  }

  @Post(':id/submit')
  @UseGuards(RbacGuard)
  @Permissions('quotes:submit')
  @ApiOperation({ summary: 'Submit a quote for approval' })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitQuoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotesService.submit(id, userId, dto.notes);
  }

  @Post(':id/approve')
  @UseGuards(RbacGuard)
  @Permissions('quotes:approve')
  @ApiOperation({ summary: 'Approve a quote' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveQuoteDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.approve(id, userId, userPermissions, dto.notes);
  }

  @Post(':id/reject')
  @UseGuards(RbacGuard)
  @Permissions('quotes:reject')
  @ApiOperation({ summary: 'Reject a quote' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectQuoteDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.reject(id, userId, userPermissions, dto.reason);
  }

  @Post(':id/withdraw')
  @UseGuards(RbacGuard)
  @Permissions('quotes:submit')
  @ApiOperation({ summary: 'Withdraw a quote from approval (change status back to DRAFT)' })
  async withdraw(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotesService.withdraw(id, userId);
  }

  @Post(':id/outcome')
  @UseGuards(RbacGuard)
  @Permissions('quotes:approve')
  @ApiOperation({ summary: 'Mark quote as WON or LOST' })
  async markOutcome(
    @Param('id') id: string,
    @Query('outcome', new ParseEnumPipe(['WON', 'LOST'])) outcome: 'WON' | 'LOST',
    @Body() dto: QuoteOutcomeDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.markOutcome(id, outcome, userId, userPermissions, dto.lossReasonCategory, dto.reasonNotes);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('quotes:delete')
  @ApiOperation({ summary: 'Delete a quote' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.quotesService.remove(id, userId, userPermissions);
  }
}
