"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceSchedulesModule = void 0;
const common_1 = require("@nestjs/common");
const maintenance_schedules_controller_1 = require("./maintenance-schedules.controller");
const maintenance_schedules_service_1 = require("./maintenance-schedules.service");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let MaintenanceSchedulesModule = class MaintenanceSchedulesModule {
};
exports.MaintenanceSchedulesModule = MaintenanceSchedulesModule;
exports.MaintenanceSchedulesModule = MaintenanceSchedulesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [maintenance_schedules_controller_1.MaintenanceSchedulesController],
        providers: [maintenance_schedules_service_1.MaintenanceSchedulesService],
        exports: [maintenance_schedules_service_1.MaintenanceSchedulesService],
    })
], MaintenanceSchedulesModule);
//# sourceMappingURL=maintenance-schedules.module.js.map