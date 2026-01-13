import { PrismaService } from '../../common/prisma/prisma.service';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        services: {
            database: string;
        };
    }>;
}
