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
exports.CreateCostProfileDto = exports.CostProfileConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
class CostProfileConfigDto {
    fuel;
    communicationsMonthly;
    laborMonthly;
    docsGpsMonthly;
    depreciationMonthly;
    overheadPerTrip;
    includeEmptyLeg;
    emptyLegFactor;
    profitMarginPercent;
}
exports.CostProfileConfigDto = CostProfileConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Fuel cost per unit (e.g., per liter)' }),
    __metadata("design:type", Object)
], CostProfileConfigDto.prototype, "fuel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Monthly communications cost (e.g., MTN)' }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "communicationsMonthly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Monthly labor cost (e.g., HR per month)' }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "laborMonthly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Monthly documents and GPS cost' }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "docsGpsMonthly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Monthly depreciation cost (DP per month)' }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "depreciationMonthly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Overhead cost per trip' }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "overheadPerTrip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Include empty return leg in calculations', default: false }),
    __metadata("design:type", Boolean)
], CostProfileConfigDto.prototype, "includeEmptyLeg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Empty leg factor (multiplier for return distance)', default: 1.0 }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "emptyLegFactor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default profit margin percentage', default: 0 }),
    __metadata("design:type", Number)
], CostProfileConfigDto.prototype, "profitMarginPercent", void 0);
class CreateCostProfileDto {
    name;
    vehicleType;
    currency;
    isActive;
    config;
}
exports.CreateCostProfileDto = CreateCostProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCostProfileDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VehicleType }),
    (0, class_validator_1.IsEnum)(client_1.VehicleType),
    __metadata("design:type", String)
], CreateCostProfileDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCostProfileDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCostProfileDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CostProfileConfigDto }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CostProfileConfigDto),
    __metadata("design:type", CostProfileConfigDto)
], CreateCostProfileDto.prototype, "config", void 0);
//# sourceMappingURL=create-cost-profile.dto.js.map