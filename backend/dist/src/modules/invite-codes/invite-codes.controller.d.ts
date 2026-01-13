import { InviteCodesService } from './invite-codes.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
export declare class InviteCodesController {
    private readonly inviteCodesService;
    constructor(inviteCodesService: InviteCodesService);
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
    deactivate(userId: string, id: string): Promise<{
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
