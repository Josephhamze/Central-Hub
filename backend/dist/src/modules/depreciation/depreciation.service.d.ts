import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepreciationProfileDto } from './dto/create-profile.dto';
import { RunMonthlyDepreciationDto } from './dto/run-monthly.dto';
export declare class DepreciationService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): Promise<{
        items: ({
            asset: {
                id: string;
                name: string;
                assetTag: string;
                acquisitionCost: import("@prisma/client/runtime/library").Decimal;
                currentValue: import("@prisma/client/runtime/library").Decimal;
            };
            entries: {
                id: string;
                createdAt: Date;
                period: string;
                assetId: string;
                profileId: string;
                depreciationAmount: import("@prisma/client/runtime/library").Decimal;
                bookValueAfter: import("@prisma/client/runtime/library").Decimal;
                isPosted: boolean;
                postedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            assetId: string;
            method: import(".prisma/client").$Enums.DepreciationMethod;
            usefulLifeYears: number;
            salvageValue: import("@prisma/client/runtime/library").Decimal;
            startDate: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(assetId: string): Promise<{
        asset: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            assetTag: string;
            manufacturer: string | null;
            model: string | null;
            serialNumber: string | null;
            acquisitionDate: Date;
            acquisitionCost: import("@prisma/client/runtime/library").Decimal;
            currentValue: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.AssetStatus;
            location: string | null;
            projectId: string | null;
            warehouseId: string | null;
            assignedTo: string | null;
            criticality: import(".prisma/client").$Enums.AssetCriticality;
            expectedLifeYears: number | null;
            notes: string | null;
        };
        entries: {
            id: string;
            createdAt: Date;
            period: string;
            assetId: string;
            profileId: string;
            depreciationAmount: import("@prisma/client/runtime/library").Decimal;
            bookValueAfter: import("@prisma/client/runtime/library").Decimal;
            isPosted: boolean;
            postedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        assetId: string;
        method: import(".prisma/client").$Enums.DepreciationMethod;
        usefulLifeYears: number;
        salvageValue: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
    }>;
    createProfile(dto: CreateDepreciationProfileDto): Promise<{
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        assetId: string;
        method: import(".prisma/client").$Enums.DepreciationMethod;
        usefulLifeYears: number;
        salvageValue: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
    }>;
    runMonthly(dto: RunMonthlyDepreciationDto, actorUserId: string): Promise<{
        period: string;
        entriesCreated: number;
        entries: {
            assetId: string;
            assetTag: string;
            depreciationAmount: number;
            bookValueAfter: number;
        }[];
    }>;
    postEntry(assetId: string, period: string, actorUserId: string): Promise<{
        id: string;
        createdAt: Date;
        period: string;
        assetId: string;
        profileId: string;
        depreciationAmount: import("@prisma/client/runtime/library").Decimal;
        bookValueAfter: import("@prisma/client/runtime/library").Decimal;
        isPosted: boolean;
        postedAt: Date | null;
    }>;
    postAllForPeriod(period: string, actorUserId: string): Promise<{
        period: string;
        total: number;
        posted: number;
        failed: number;
        results: ({
            assetId: string;
            success: boolean;
            depreciationAmount: import("@prisma/client/runtime/library").Decimal;
            error?: undefined;
        } | {
            assetId: string;
            success: boolean;
            error: any;
            depreciationAmount?: undefined;
        })[];
    }>;
}
