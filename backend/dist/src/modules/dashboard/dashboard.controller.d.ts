export declare class DashboardController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        widgets: never[];
        metrics: never[];
    }>;
    getStats(): Promise<{
        message: string;
        module: string;
        status: string;
        data: {};
    }>;
}
