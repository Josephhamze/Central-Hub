"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExcavatorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_excavator_dto_1 = require("./create-excavator.dto");
class UpdateExcavatorDto extends (0, mapped_types_1.PartialType)(create_excavator_dto_1.CreateExcavatorDto) {
}
exports.UpdateExcavatorDto = UpdateExcavatorDto;
//# sourceMappingURL=update-excavator.dto.js.map