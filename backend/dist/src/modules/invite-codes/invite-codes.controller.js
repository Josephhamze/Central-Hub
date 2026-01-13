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
exports.InviteCodesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const invite_codes_service_1 = require("./invite-codes.service");
const create_invite_code_dto_1 = require("./dto/create-invite-code.dto");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const common_2 = require("@nestjs/common");
let InviteCodesController = class InviteCodesController {
    inviteCodesService;
    constructor(inviteCodesService) {
        this.inviteCodesService = inviteCodesService;
    }
    async create(userId, dto) {
        return this.inviteCodesService.create(userId, dto);
    }
    async findAll(userId) {
        return this.inviteCodesService.findAll(userId);
    }
    async deactivate(userId, id) {
        return this.inviteCodesService.deactivate(userId, id);
    }
};
exports.InviteCodesController = InviteCodesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('users:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new invite code (admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_invite_code_dto_1.CreateInviteCodeDto]),
    __metadata("design:returntype", Promise)
], InviteCodesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('users:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all invite codes (admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InviteCodesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('users:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate an invite code (admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InviteCodesController.prototype, "deactivate", null);
exports.InviteCodesController = InviteCodesController = __decorate([
    (0, swagger_1.ApiTags)('Invite Codes'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('invite-codes'),
    (0, common_2.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [invite_codes_service_1.InviteCodesService])
], InviteCodesController);
//# sourceMappingURL=invite-codes.controller.js.map