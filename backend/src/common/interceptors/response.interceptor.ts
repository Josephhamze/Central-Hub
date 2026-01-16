import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Decimal } from '@prisma/client/runtime/library';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
  };
}

/**
 * Recursively transforms Prisma Decimal objects to JavaScript numbers
 * This is necessary because Prisma Decimal objects don't serialize to JSON properly
 */
function transformDecimals(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check if it's a Prisma Decimal
  if (obj instanceof Decimal || (obj && typeof obj === 'object' && typeof obj.toNumber === 'function' && obj.constructor?.name === 'Decimal')) {
    return obj.toNumber();
  }

  // Handle Date objects - keep them as-is (they serialize properly)
  if (obj instanceof Date) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformDecimals(item));
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const key of Object.keys(obj)) {
      transformed[key] = transformDecimals(obj[key]);
    }
    return transformed;
  }

  // Return primitives as-is
  return obj;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: transformDecimals(data),
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      })),
    );
  }
}
