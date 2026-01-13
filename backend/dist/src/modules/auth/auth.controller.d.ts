import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthTokens>;
    register(dto: RegisterDto): Promise<AuthTokens>;
    refresh(dto: RefreshTokenDto): Promise<AuthTokens>;
    logout(userId: string, dto: LogoutDto): Promise<{
        message: string;
    }>;
}
