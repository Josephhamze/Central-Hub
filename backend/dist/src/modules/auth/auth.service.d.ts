import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { InviteCodesService } from '../invite-codes/invite-codes.service';
export interface TokenPayload {
    sub: string;
    email: string;
    type: 'access' | 'refresh';
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private inviteCodesService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, inviteCodesService: InviteCodesService);
    login(dto: LoginDto): Promise<AuthTokens>;
    register(dto: RegisterDto): Promise<AuthTokens>;
    refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens>;
    logout(userId: string, refreshToken?: string): Promise<void>;
    private generateTokens;
}
