export declare class CreateStockItemDto {
    companyId?: string;
    projectId: string;
    warehouseId: string;
    name: string;
    sku?: string;
    description?: string;
    uom: string;
    minUnitPrice: number;
    defaultUnitPrice: number;
    minOrderQty: number;
    truckloadOnly?: boolean;
    isActive?: boolean;
}
