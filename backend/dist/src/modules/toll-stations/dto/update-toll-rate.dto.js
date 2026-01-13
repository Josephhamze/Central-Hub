"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTollRateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_toll_rate_dto_1 = require("./create-toll-rate.dto");
class UpdateTollRateDto extends (0, swagger_1.PartialType)(create_toll_rate_dto_1.CreateTollRateDto) {
}
exports.UpdateTollRateDto = UpdateTollRateDto;
//# sourceMappingURL=update-toll-rate.dto.js.map