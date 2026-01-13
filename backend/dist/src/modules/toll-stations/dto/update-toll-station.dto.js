"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTollStationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_toll_station_dto_1 = require("./create-toll-station.dto");
class UpdateTollStationDto extends (0, swagger_1.PartialType)(create_toll_station_dto_1.CreateTollStationDto) {
}
exports.UpdateTollStationDto = UpdateTollStationDto;
//# sourceMappingURL=update-toll-station.dto.js.map