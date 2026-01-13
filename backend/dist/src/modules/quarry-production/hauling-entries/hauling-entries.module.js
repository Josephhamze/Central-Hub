"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HaulingEntriesModule = void 0;
const common_1 = require("@nestjs/common");
const hauling_entries_service_1 = require("./hauling-entries.service");
const hauling_entries_controller_1 = require("./hauling-entries.controller");
const prisma_module_1 = require("../../../common/prisma/prisma.module");
let HaulingEntriesModule = class HaulingEntriesModule {
};
exports.HaulingEntriesModule = HaulingEntriesModule;
exports.HaulingEntriesModule = HaulingEntriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [hauling_entries_controller_1.HaulingEntriesController],
        providers: [hauling_entries_service_1.HaulingEntriesService],
        exports: [hauling_entries_service_1.HaulingEntriesService],
    })
], HaulingEntriesModule);
//# sourceMappingURL=hauling-entries.module.js.map