import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Cache Module - Optional Redis caching
 * 
 * To enable Redis caching:
 * 1. Add Redis service in Railway dashboard
 * 2. Set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD environment variables
 * 3. Uncomment the Redis store configuration below
 * 
 * For now, using in-memory cache (works without Redis)
 */
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        // If Redis is configured, use it. Otherwise use in-memory cache
        if (redisHost && redisPort) {
          // Uncomment when Redis is available:
          // const { redisStore } = await import('cache-manager-redis-store');
          // return {
          //   store: redisStore,
          //   host: redisHost,
          //   port: redisPort,
          //   password: redisPassword,
          //   ttl: 300, // 5 minutes default
          // };
        }

        // Default: in-memory cache
        return {
          ttl: 300, // 5 minutes
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
