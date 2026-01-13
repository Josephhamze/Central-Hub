export declare class CreateStockLevelDto {
    date: string;
    productTypeId: string;
    stockpileLocationId: string;
    openingStock?: number;
    sold?: number;
    adjustments?: number;
    adjustmentReason?: string;
}
