import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: {
        timestamp: string;
        path: string;
    };
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorCode;
}
