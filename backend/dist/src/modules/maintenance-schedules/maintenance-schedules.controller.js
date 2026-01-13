"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceSchedulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const maintenance_schedules_service_1 = require("./maintenance-schedules.service");
const create_maintenance_schedule_dto_1 = require("./dto/create-maintenance-schedule.dto");
const update_maintenance_schedule_dto_1 = require("./dto/update-maintenance-schedule.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let MaintenanceSchedulesController = class MaintenanceSchedulesController {
    maintenanceSchedulesService;
    constructor(maintenanceSchedulesService) {
        this.maintenanceSchedulesService = maintenanceSchedulesService;
    }
    async findAll(page = 1, limit = 20, assetId, isActive) {
        return this.maintenanceSchedulesService.findAll(page, limit, assetId, isActive);
    }
    async getOverdue() {
        return this.maintenanceSchedulesService.getOverdue();
    }
    async findOne(id) {
        return this.maintenanceSchedulesService.findOne(id);
    }
    async create(dto) {
        return this.maintenanceSchedulesService.create(dto);
    }
    async update(id, dto) {
        return this.maintenanceSchedulesService.update(id, dto);
    }
    async remove(id) {
        return this.maintenanceSchedulesService.remove(id);
    }
};
exports.MaintenanceSchedulesController = MaintenanceSchedulesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('maintenance:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance schedules' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'assetId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of maintenance schedules' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('assetId')),
    __param(3, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, permissions_decorator_1.Permissions)('maintenance:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overdue maintenance schedules' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of overdue schedules' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "getOverdue", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('maintenance:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get maintenance schedule by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Maintenance schedule details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('maintenance:schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new maintenance schedule' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schedule created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_maintenance_schedule_dto_1.CreateMaintenanceScheduleDto]),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('maintenance:schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a maintenance schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_maintenance_schedule_dto_1.UpdateMaintenanceScheduleDto]),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('maintenance:schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a maintenance schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete schedule with work orders' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaintenanceSchedulesController.prototype, "remove", null);
exports.MaintenanceSchedulesController = MaintenanceSchedulesController = __decorate([
    (0, swagger_1.ApiTags)('Maintenance Schedules'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('maintenance-schedules'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [maintenance_schedules_service_1.MaintenanceSchedulesService])
], MaintenanceSchedulesController);
//# sourceMappingURL=maintenance-schedules.controller.js.map