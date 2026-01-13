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
exports.HaulingEntriesController = void 0;
const common_1 = require("@nestjs/common");
const hauling_entries_service_1 = require("./hauling-entries.service");
const create_hauling_entry_dto_1 = require("./dto/create-hauling-entry.dto");
const update_hauling_entry_dto_1 = require("./dto/update-hauling-entry.dto");
const approve_entry_dto_1 = require("../excavator-entries/dto/approve-entry.dto");
const reject_entry_dto_1 = require("../excavator-entries/dto/reject-entry.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let HaulingEntriesController = class HaulingEntriesController {
    haulingEntriesService;
    constructor(haulingEntriesService) {
        this.haulingEntriesService = haulingEntriesService;
    }
    create(createDto, userId) {
        return this.haulingEntriesService.create(createDto, userId);
    }
    findAll(page, limit, dateFrom, dateTo, shift, truckId, driverId, status) {
        return this.haulingEntriesService.findAll(page, limit, dateFrom, dateTo, shift, truckId, driverId, status);
    }
    findOne(id) {
        return this.haulingEntriesService.findOne(id);
    }
    update(id, updateDto, userId) {
        return this.haulingEntriesService.update(id, updateDto, userId);
    }
    approve(id, approveDto, approverId) {
        return this.haulingEntriesService.approve(id, approverId, approveDto.notes);
    }
    reject(id, rejectDto, approverId) {
        return this.haulingEntriesService.reject(id, approverId, rejectDto.reason);
    }
    remove(id, userId) {
        return this.haulingEntriesService.remove(id, userId);
    }
};
exports.HaulingEntriesController = HaulingEntriesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hauling_entry_dto_1.CreateHaulingEntryDto, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:view'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __param(4, (0, common_1.Query)('shift')),
    __param(5, (0, common_1.Query)('truckId')),
    __param(6, (0, common_1.Query)('driverId')),
    __param(7, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_hauling_entry_dto_1.UpdateHaulingEntryDto, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_entry_dto_1.ApproveEntryDto, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_entry_dto_1.RejectEntryDto, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:hauling:delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HaulingEntriesController.prototype, "remove", null);
exports.HaulingEntriesController = HaulingEntriesController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/hauling-entries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [hauling_entries_service_1.HaulingEntriesService])
], HaulingEntriesController);
//# sourceMappingURL=hauling-entries.controller.js.map