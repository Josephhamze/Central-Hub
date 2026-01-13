import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { VarianceQueryDto } from './dto/variance-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('api/v1/quarry-production/dashboard')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('variance')
  @Permissions('quarry:dashboard:view')
  getVarianceAnalysis(@Query() query: VarianceQueryDto) {
    return this.dashboardService.getVarianceAnalysis(
      new Date(query.date),
      query.shift,
    );
  }

  @Get('kpis')
  @Permissions('quarry:dashboard:view')
  getKPIs(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.dashboardService.getKPIs(
      new Date(dateFrom),
      new Date(dateTo),
    );
  }

  @Get('daily-summary')
  @Permissions('quarry:dashboard:view')
  getDailySummary(@Query('date') date: string) {
    return this.dashboardService.getDailySummary(new Date(date));
  }

  @Get('weekly-summary')
  @Permissions('quarry:dashboard:view')
  getWeeklySummary(@Query('startDate') startDate: string) {
    return this.dashboardService.getWeeklySummary(new Date(startDate));
  }
}
