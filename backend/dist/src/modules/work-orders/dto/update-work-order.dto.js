"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_work_order_dto_1 = require("./create-work-order.dto");
class UpdateWorkOrderDto extends (0, swagger_1.PartialType)(create_work_order_dto_1.CreateWorkOrderDto) {
}
exports.UpdateWorkOrderDto = UpdateWorkOrderDto;
//# sourceMappingURL=update-work-order.dto.js.map