import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
export declare class InviteCodesService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateCode;
    create(userId: string, dto: CreateInviteCodeDto): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        updatedAt: Date;
        maxUses: number;
        expiresAt: Date | null;
        usedBy: string | null;
        createdBy: string;
        usedAt: Date | null;
        useCount: number;
        isActive: boolean;
    }>;
    validate(code: string): Promise<{
        valid: boolean;
        message?: string;
    }>;
    markAsUsed(code: string, userId: string): Promise<void>;
    findAll(userId: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        code: string;
        createdAt: Date;
        updatedAt: Date;
        maxUses: number;
        expiresAt: Date | null;
        usedBy: string | null;
        createdBy: string;
        usedAt: Date | null;
        useCount: number;
        isActive: boolean;
    })[]>;
    deactivate(userId: string, codeId: string): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        updatedAt: Date;
        maxUses: number;
        expiresAt: Date | null;
        usedBy: string | null;
        createdBy: string;
        usedAt: Date | null;
        useCount: number;
        isActive: boolean;
    }>;
}
