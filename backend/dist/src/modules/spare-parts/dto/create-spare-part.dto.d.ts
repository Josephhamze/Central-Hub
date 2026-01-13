export declare class CreateSparePartDto {
    name: string;
    sku: string;
    uom: string;
    warehouseId: string;
    quantityOnHand?: number;
    minStockLevel?: number;
    unitCost: number;
    isCritical?: boolean;
}
