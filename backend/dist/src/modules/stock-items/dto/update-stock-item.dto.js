"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStockItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_stock_item_dto_1 = require("./create-stock-item.dto");
class UpdateStockItemDto extends (0, swagger_1.PartialType)(create_stock_item_dto_1.CreateStockItemDto) {
}
exports.UpdateStockItemDto = UpdateStockItemDto;
//# sourceMappingURL=update-stock-item.dto.js.map