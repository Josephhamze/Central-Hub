export declare class OperationsController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getWorkOrders(): Promise<{
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
