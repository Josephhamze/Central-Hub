"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCrusherDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_crusher_dto_1 = require("./create-crusher.dto");
class UpdateCrusherDto extends (0, mapped_types_1.PartialType)(create_crusher_dto_1.CreateCrusherDto) {
}
exports.UpdateCrusherDto = UpdateCrusherDto;
//# sourceMappingURL=update-crusher.dto.js.map