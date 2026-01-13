export declare class LogisticsController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getFleet(): Promise<{
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
    getShipments(): Promise<{
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
