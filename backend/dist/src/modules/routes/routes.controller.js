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
exports.RoutesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const routes_service_1 = require("./routes.service");
const create_route_dto_1 = require("./dto/create-route.dto");
const update_route_dto_1 = require("./dto/update-route.dto");
const create_toll_dto_1 = require("./dto/create-toll.dto");
const set_route_stations_dto_1 = require("./dto/set-route-stations.dto");
const create_route_request_dto_1 = require("./dto/create-route-request.dto");
const review_route_request_dto_1 = require("./dto/review-route-request.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let RoutesController = class RoutesController {
    routesService;
    constructor(routesService) {
        this.routesService = routesService;
    }
    async findAll(page = 1, limit = 20, fromCity, toCity, isActive, search) {
        return this.routesService.findAll(+page, +limit, {
            fromCity,
            toCity,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            search,
        });
    }
    async createRouteRequest(dto, userId) {
        return this.routesService.createRouteRequest(dto, userId);
    }
    async findAllRouteRequests(status, page = 1, limit = 20) {
        return this.routesService.findAllRouteRequests(+page, +limit, status);
    }
    async findOneRouteRequest(id) {
        return this.routesService.findOneRouteRequest(id);
    }
    async reviewRouteRequest(id, dto, reviewerId) {
        return this.routesService.reviewRouteRequest(id, dto, reviewerId);
    }
    async deleteRouteRequest(id) {
        return this.routesService.deleteRouteRequest(id);
    }
    async findOne(id) {
        return this.routesService.findOne(id);
    }
    async getExpectedToll(id, vehicleType) {
        const total = await this.routesService.getExpectedTollTotal(id, vehicleType);
        return { routeId: id, vehicleType, total: total.toString() };
    }
    async create(dto, userId) {
        return this.routesService.create(dto, userId);
    }
    async bulkImport(file, userId) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (!file.mimetype.includes('spreadsheet') && !file.mimetype.includes('excel') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
            throw new common_1.BadRequestException('File must be an Excel file (.xlsx or .xls)');
        }
        return this.routesService.bulkImport(file, userId);
    }
    async update(id, dto) {
        return this.routesService.update(id, dto);
    }
    async deactivate(id) {
        return this.routesService.deactivate(id);
    }
    async setRouteStations(id, dto, userId) {
        return this.routesService.setRouteStations(id, dto, userId);
    }
    async getRouteStations(id) {
        const route = await this.routesService.findOne(id);
        return route.tollStations;
    }
    async remove(id) {
        return this.routesService.remove(id);
    }
    async addToll(dto) {
        return this.routesService.addToll(dto);
    }
    async removeToll(id) {
        return this.routesService.removeToll(id);
    }
};
exports.RoutesController = RoutesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all routes' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fromCity', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'toCity', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('fromCity')),
    __param(3, (0, common_1.Query)('toCity')),
    __param(4, (0, common_1.Query)('isActive')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('quotes:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a route request (pending approval)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_route_request_dto_1.CreateRouteRequestDto, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "createRouteRequest", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all route requests (admin only)' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "findAllRouteRequests", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get route request by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "findOneRouteRequest", null);
__decorate([
    (0, common_1.Post)('requests/:id/review'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Review (approve/reject) a route request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_route_request_dto_1.ReviewRouteRequestDto, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "reviewRouteRequest", null);
__decorate([
    (0, common_1.Delete)('requests/:id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a rejected route request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "deleteRouteRequest", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get route by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/expected-toll'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get expected toll total for route by vehicle type' }),
    (0, swagger_1.ApiQuery)({ name: 'vehicleType', enum: client_1.VehicleType, required: true }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('vehicleType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "getExpectedToll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new route' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_route_dto_1.CreateRouteDto, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
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
    (0, swagger_1.ApiOperation)({ summary: 'Bulk import routes from Excel file' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a route' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_route_dto_1.UpdateRouteDto]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a route' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/stations'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Set ordered toll stations for a route' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_route_stations_dto_1.SetRouteStationsDto, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "setRouteStations", null);
__decorate([
    (0, common_1.Get)(':id/stations'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get toll stations for a route' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "getRouteStations", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a route' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('tolls'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a toll to a route (legacy)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_toll_dto_1.CreateTollDto]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "addToll", null);
__decorate([
    (0, common_1.Delete)('tolls/:id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:routes:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a toll (legacy)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "removeToll", null);
exports.RoutesController = RoutesController = __decorate([
    (0, swagger_1.ApiTags)('Routes'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('routes'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [routes_service_1.RoutesService])
], RoutesController);
//# sourceMappingURL=routes.controller.js.map