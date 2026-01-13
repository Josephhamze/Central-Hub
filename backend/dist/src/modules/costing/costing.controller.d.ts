export declare class CostingController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getCostCenters(): Promise<{
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
