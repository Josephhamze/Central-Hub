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
exports.TollPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const toll_payments_service_1 = require("./toll-payments.service");
const create_toll_payment_dto_1 = require("./dto/create-toll-payment.dto");
const update_toll_payment_dto_1 = require("./dto/update-toll-payment.dto");
const reconcile_toll_payments_dto_1 = require("./dto/reconcile-toll-payments.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let TollPaymentsController = class TollPaymentsController {
    tollPaymentsService;
    constructor(tollPaymentsService) {
        this.tollPaymentsService = tollPaymentsService;
    }
    async findAll(page = 1, limit = 20, startDate, endDate, routeId, tollStationId, vehicleType, status, paidByUserId) {
        return this.tollPaymentsService.findAll(+page, +limit, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            routeId,
            tollStationId,
            vehicleType,
            status,
            paidByUserId,
        });
    }
    async findOne(id) {
        return this.tollPaymentsService.findOne(id);
    }
    async create(dto, userId) {
        return this.tollPaymentsService.create(dto, userId);
    }
    async update(id, dto, userId, userPermissions) {
        return this.tollPaymentsService.update(id, dto, userId, userPermissions);
    }
    async submit(id) {
        return this.tollPaymentsService.submit(id);
    }
    async approve(id) {
        return this.tollPaymentsService.approve(id);
    }
    async post(id) {
        return this.tollPaymentsService.post(id);
    }
    async remove(id, userId, userPermissions) {
        return this.tollPaymentsService.remove(id, userId, userPermissions);
    }
    async reconcile(dto) {
        return this.tollPaymentsService.reconcile(dto);
    }
};
exports.TollPaymentsController = TollPaymentsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all toll payments' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'routeId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tollStationId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'vehicleType', enum: client_1.VehicleType, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.TollPaymentStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'paidByUserId', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('routeId')),
    __param(5, (0, common_1.Query)('tollStationId')),
    __param(6, (0, common_1.Query)('vehicleType')),
    __param(7, (0, common_1.Query)('status')),
    __param(8, (0, common_1.Query)('paidByUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get toll payment by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new toll payment' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_toll_payment_dto_1.CreateTollPaymentDto, String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a toll payment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_toll_payment_dto_1.UpdateTollPaymentDto, String, Array]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a toll payment for approval' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a toll payment' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/post'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:post'),
    (0, swagger_1.ApiOperation)({ summary: 'Post a toll payment (finalize)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "post", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a toll payment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('reconcile'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:toll_payments:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Reconcile expected vs actual toll payments' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reconcile_toll_payments_dto_1.ReconcileTollPaymentsDto]),
    __metadata("design:returntype", Promise)
], TollPaymentsController.prototype, "reconcile", null);
exports.TollPaymentsController = TollPaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Toll Payments'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('toll-payments'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [toll_payments_service_1.TollPaymentsService])
], TollPaymentsController);
//# sourceMappingURL=toll-payments.controller.js.map