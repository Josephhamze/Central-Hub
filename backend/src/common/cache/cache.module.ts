import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Cache Module - Redis caching for AWS EC2 deployment
 *
 * Required environment variables for Redis:
 * - REDIS_HOST: Redis server hostname
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis authentication password
 *
 * Falls back to in-memory cache if Redis is not configured.
 */
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        // If Redis is configured, use it
        if (redisHost) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return {
            store: redisStore,
            socket: {
              host: redisHost,
              port: redisPort,
            },
            password: redisPassword,
            ttl: 300 * 1000, // 5 minutes in milliseconds
          };
        }

        // Fallback: in-memory cache for local development
        return {
          ttl: 300 * 1000, // 5 minutes
          max: 100, // max items in cache
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
