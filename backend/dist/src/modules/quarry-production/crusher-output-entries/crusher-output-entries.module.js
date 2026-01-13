"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrusherOutputEntriesModule = void 0;
const common_1 = require("@nestjs/common");
const crusher_output_entries_service_1 = require("./crusher-output-entries.service");
const crusher_output_entries_controller_1 = require("./crusher-output-entries.controller");
const prisma_module_1 = require("../../../common/prisma/prisma.module");
let CrusherOutputEntriesModule = class CrusherOutputEntriesModule {
};
exports.CrusherOutputEntriesModule = CrusherOutputEntriesModule;
exports.CrusherOutputEntriesModule = CrusherOutputEntriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [crusher_output_entries_controller_1.CrusherOutputEntriesController],
        providers: [crusher_output_entries_service_1.CrusherOutputEntriesService],
        exports: [crusher_output_entries_service_1.CrusherOutputEntriesService],
    })
], CrusherOutputEntriesModule);
//# sourceMappingURL=crusher-output-entries.module.js.map