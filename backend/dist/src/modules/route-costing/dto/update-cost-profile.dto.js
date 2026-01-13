"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCostProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_cost_profile_dto_1 = require("./create-cost-profile.dto");
class UpdateCostProfileDto extends (0, swagger_1.PartialType)(create_cost_profile_dto_1.CreateCostProfileDto) {
}
exports.UpdateCostProfileDto = UpdateCostProfileDto;
//# sourceMappingURL=update-cost-profile.dto.js.map