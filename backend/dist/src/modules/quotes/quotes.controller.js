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
exports.QuotesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quotes_service_1 = require("./quotes.service");
const create_quote_dto_1 = require("./dto/create-quote.dto");
const update_quote_dto_1 = require("./dto/update-quote.dto");
const submit_quote_dto_1 = require("./dto/submit-quote.dto");
const approve_quote_dto_1 = require("./dto/approve-quote.dto");
const reject_quote_dto_1 = require("./dto/reject-quote.dto");
const quote_outcome_dto_1 = require("./dto/quote-outcome.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let QuotesController = class QuotesController {
    quotesService;
    constructor(quotesService) {
        this.quotesService = quotesService;
    }
    async findAll(userId, userPermissions, status, companyId, projectId, salesRepUserId, startDate, endDate, includeArchived, page = 1, limit = 20) {
        return this.quotesService.findAll(userId, userPermissions, {
            status,
            companyId,
            projectId,
            salesRepUserId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            includeArchived: includeArchived === 'true',
        }, +page, +limit);
    }
    async getKPIs(userId, userPermissions, companyId, projectId, salesRepUserId, startDate, endDate) {
        return this.quotesService.getSalesKPIs(userId, userPermissions, {
            companyId,
            projectId,
            salesRepUserId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
    async findOne(id, userId, userPermissions) {
        return this.quotesService.findOne(id, userId, userPermissions);
    }
    async create(dto, userId) {
        return this.quotesService.create(dto, userId);
    }
    async update(id, dto, userId, userPermissions) {
        return this.quotesService.update(id, dto, userId, userPermissions);
    }
    async submit(id, dto, userId) {
        return this.quotesService.submit(id, userId, dto.notes);
    }
    async approve(id, dto, userId, userPermissions) {
        return this.quotesService.approve(id, userId, userPermissions, dto.notes);
    }
    async reject(id, dto, userId, userPermissions) {
        return this.quotesService.reject(id, userId, userPermissions, dto.reason);
    }
    async withdraw(id, userId) {
        return this.quotesService.withdraw(id, userId);
    }
    async markOutcome(id, outcome, dto, userId, userPermissions) {
        return this.quotesService.markOutcome(id, outcome, userId, userPermissions, dto.lossReasonCategory, dto.reasonNotes);
    }
    async archive(id, userId, userPermissions) {
        return this.quotesService.archive(id, userId, userPermissions);
    }
    async remove(id, userId, userPermissions) {
        return this.quotesService.remove(id, userId, userPermissions);
    }
};
exports.QuotesController = QuotesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all quotes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('companyId')),
    __param(4, (0, common_1.Query)('projectId')),
    __param(5, (0, common_1.Query)('salesRepUserId')),
    __param(6, (0, common_1.Query)('startDate')),
    __param(7, (0, common_1.Query)('endDate')),
    __param(8, (0, common_1.Query)('includeArchived')),
    __param(9, (0, common_1.Query)('page')),
    __param(10, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, String, String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('kpis'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('reporting:view_sales_kpis'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sales KPIs' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __param(2, (0, common_1.Query)('companyId')),
    __param(3, (0, common_1.Query)('projectId')),
    __param(4, (0, common_1.Query)('salesRepUserId')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get quote by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new quote' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_quote_dto_1.CreateQuoteDto, String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_quote_dto_1.UpdateQuoteDto, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a quote for approval' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_quote_dto_1.SubmitQuoteDto, String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_quote_dto_1.ApproveQuoteDto, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_quote_dto_1.RejectQuoteDto, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/withdraw'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw a quote from approval (change status back to DRAFT)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)(':id/outcome'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark quote as WON or LOST' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('outcome', new common_1.ParseEnumPipe(['WON', 'LOST']))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, quote_outcome_dto_1.QuoteOutcomeDto, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "markOutcome", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "archive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "remove", null);
exports.QuotesController = QuotesController = __decorate([
    (0, swagger_1.ApiTags)('Quotes'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('quotes'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [quotes_service_1.QuotesService])
], QuotesController);
//# sourceMappingURL=quotes.controller.js.map