"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExcavatorEntryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_excavator_entry_dto_1 = require("./create-excavator-entry.dto");
class UpdateExcavatorEntryDto extends (0, mapped_types_1.PartialType)(create_excavator_entry_dto_1.CreateExcavatorEntryDto) {
}
exports.UpdateExcavatorEntryDto = UpdateExcavatorEntryDto;
//# sourceMappingURL=update-excavator-entry.dto.js.map