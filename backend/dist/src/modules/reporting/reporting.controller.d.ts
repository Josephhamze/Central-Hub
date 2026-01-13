export declare class ReportingController {
    getOverview(): Promise<{
        message: string;
        module: string;
        status: string;
        sections: {
            name: string;
            status: string;
        }[];
    }>;
    getTemplates(): Promise<{
        message: string;
        module: string;
        status: string;
        items: never[];
    }>;
    getDashboards(): Promise<{
        message: string;
        module: string;
        status: string;
        items: never[];
    }>;
}
