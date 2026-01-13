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
exports.TollStationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const toll_stations_service_1 = require("./toll-stations.service");
const create_toll_station_dto_1 = require("./dto/create-toll-station.dto");
const update_toll_station_dto_1 = require("./dto/update-toll-station.dto");
const create_toll_rate_dto_1 = require("./dto/create-toll-rate.dto");
const update_toll_rate_dto_1 = require("./dto/update-toll-rate.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let TollStationsController = class TollStationsController {
    tollStationsService;
    constructor(tollStationsService) {
        this.tollStationsService = tollStationsService;
    }
    async findAll(page = 1, limit = 20, isActive, search) {
        return this.tollStationsService.findAll(+page, +limit, {
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            search,
        });
    }
    async findOne(id) {
        return this.tollStationsService.findOne(id);
    }
    async create(dto) {
        return this.tollStationsService.create(dto);
    }
    async bulkImport(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (!file.mimetype.includes('spreadsheet') && !file.mimetype.includes('excel') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
            throw new common_1.BadRequestException('File must be an Excel file (.xlsx or .xls)');
        }
        return this.tollStationsService.bulkImport(file);
    }
    async update(id, dto) {
        return this.tollStationsService.update(id, dto);
    }
    async remove(id) {
        return this.tollStationsService.remove(id);
    }
    async getRates(id, vehicleType) {
        return this.tollStationsService.getRates(id, vehicleType);
    }
    async createRate(id, dto) {
        return this.tollStationsService.createRate(id, dto);
    }
    async updateRate(id, rateId, dto) {
        return this.tollStationsService.updateRate(id, rateId, dto);
    }
    async removeRate(id, rateId) {
        return this.tollStationsService.removeRate(id, rateId);
    }
};
exports.TollStationsController = TollStationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all toll stations' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('isActive')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get toll station by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new toll station' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_toll_station_dto_1.CreateTollStationDto]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk import toll stations with rates from Excel file' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a toll station' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_toll_station_dto_1.UpdateTollStationDto]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a toll station' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/rates'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get toll rates for a station' }),
    (0, swagger_1.ApiQuery)({ name: 'vehicleType', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('vehicleType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "getRates", null);
__decorate([
    (0, common_1.Post)(':id/rates'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a toll rate for a station' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_toll_rate_dto_1.CreateTollRateDto]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "createRate", null);
__decorate([
    (0, common_1.Put)(':id/rates/:rateId'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a toll rate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('rateId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_toll_rate_dto_1.UpdateTollRateDto]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "updateRate", null);
__decorate([
    (0, common_1.Delete)(':id/rates/:rateId'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:tolls:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a toll rate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('rateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TollStationsController.prototype, "removeRate", null);
exports.TollStationsController = TollStationsController = __decorate([
    (0, swagger_1.ApiTags)('Toll Stations'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('toll-stations'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [toll_stations_service_1.TollStationsService])
], TollStationsController);
//# sourceMappingURL=toll-stations.controller.js.map