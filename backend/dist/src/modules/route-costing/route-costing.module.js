"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteCostingModule = void 0;
const common_1 = require("@nestjs/common");
const route_costing_controller_1 = require("./route-costing.controller");
const route_costing_service_1 = require("./route-costing.service");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let RouteCostingModule = class RouteCostingModule {
};
exports.RouteCostingModule = RouteCostingModule;
exports.RouteCostingModule = RouteCostingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [route_costing_controller_1.RouteCostingController, route_costing_controller_1.CostingCalculatorController],
        providers: [route_costing_service_1.RouteCostingService],
        exports: [route_costing_service_1.RouteCostingService],
    })
], RouteCostingModule);
//# sourceMappingURL=route-costing.module.js.map