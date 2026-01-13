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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMaintenanceScheduleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateMaintenanceScheduleDto {
    assetId;
    type;
    intervalDays;
    intervalHours;
    checklistJson;
    estimatedDurationHours;
    requiredPartsJson;
    isActive;
}
exports.CreateMaintenanceScheduleDto = CreateMaintenanceScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Asset ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMaintenanceScheduleDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MaintenanceScheduleType }),
    (0, class_validator_1.IsEnum)(client_1.MaintenanceScheduleType),
    __metadata("design:type", String)
], CreateMaintenanceScheduleDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Interval in days (for time-based)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMaintenanceScheduleDto.prototype, "intervalDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Interval in hours (for usage-based)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMaintenanceScheduleDto.prototype, "intervalHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Checklist as JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMaintenanceScheduleDto.prototype, "checklistJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated duration in hours' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMaintenanceScheduleDto.prototype, "estimatedDurationHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required parts as JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMaintenanceScheduleDto.prototype, "requiredPartsJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is active', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMaintenanceScheduleDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-maintenance-schedule.dto.js.map