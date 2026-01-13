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
exports.WorkOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const work_orders_service_1 = require("./work-orders.service");
const create_work_order_dto_1 = require("./dto/create-work-order.dto");
const update_work_order_dto_1 = require("./dto/update-work-order.dto");
const complete_work_order_dto_1 = require("./dto/complete-work-order.dto");
const consume_part_dto_1 = require("./dto/consume-part.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const client_1 = require("@prisma/client");
let WorkOrdersController = class WorkOrdersController {
    workOrdersService;
    constructor(workOrdersService) {
        this.workOrdersService = workOrdersService;
    }
    async findAll(page = 1, limit = 20, status, assetId) {
        return this.workOrdersService.findAll(page, limit, status, assetId);
    }
    async findOne(id) {
        return this.workOrdersService.findOne(id);
    }
    async create(dto, userId) {
        return this.workOrdersService.create(dto, userId);
    }
    async update(id, dto) {
        return this.workOrdersService.update(id, dto);
    }
    async start(id, userId) {
        return this.workOrdersService.start(id, userId);
    }
    async complete(id, dto, userId) {
        return this.workOrdersService.complete(id, dto, userId);
    }
    async cancel(id, userId) {
        return this.workOrdersService.cancel(id, userId);
    }
    async consumePart(workOrderId, dto, userId) {
        return this.workOrdersService.consumePart(workOrderId, dto, userId);
    }
};
exports.WorkOrdersController = WorkOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('workorders:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all work orders' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.WorkOrderStatus }),
    (0, swagger_1.ApiQuery)({ name: 'assetId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of work orders' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('workorders:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get work order by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('workorders:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Work order created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_work_order_dto_1.CreateWorkOrderDto, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('workorders:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_work_order_dto_1.UpdateWorkOrderDto]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    (0, permissions_decorator_1.Permissions)('workorders:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order started' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, permissions_decorator_1.Permissions)('workorders:close'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order completed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_work_order_dto_1.CompleteWorkOrderDto, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('workorders:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order cancelled' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/consume-part'),
    (0, permissions_decorator_1.Permissions)('workorders:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Consume a spare part for a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Part consumed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, consume_part_dto_1.ConsumePartDto, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "consumePart", null);
exports.WorkOrdersController = WorkOrdersController = __decorate([
    (0, swagger_1.ApiTags)('Work Orders'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('work-orders'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService])
], WorkOrdersController);
//# sourceMappingURL=work-orders.controller.js.map