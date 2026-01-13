export declare class AdministrationController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getSettings(): Promise<{
        message: string;
        module: string;
        status: string;
        settings: {};
    }>;
    getAuditLogs(): Promise<{
        message: string;
        module: string;
        status: string;
        logs: never[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
