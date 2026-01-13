export declare class ProductionController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getProductionLines(): Promise<{
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
    getBatches(): Promise<{
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
