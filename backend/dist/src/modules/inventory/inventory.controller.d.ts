export declare class InventoryController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getWarehouses(): Promise<{
        message: string;
        module: string;
        status: string;
        items: never[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getItems(): Promise<{
        message: string;
        module: string;
        status: string;
        items: never[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
