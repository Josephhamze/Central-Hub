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
exports.CreateDepreciationProfileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateDepreciationProfileDto {
    assetId;
    method;
    usefulLifeYears;
    salvageValue;
    startDate;
}
exports.CreateDepreciationProfileDto = CreateDepreciationProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Asset ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDepreciationProfileDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DepreciationMethod }),
    (0, class_validator_1.IsEnum)(client_1.DepreciationMethod),
    __metadata("design:type", String)
], CreateDepreciationProfileDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Useful life in years' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateDepreciationProfileDto.prototype, "usefulLifeYears", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Salvage value' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDepreciationProfileDto.prototype, "salvageValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date (ISO 8601)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDepreciationProfileDto.prototype, "startDate", void 0);
//# sourceMappingURL=create-profile.dto.js.map