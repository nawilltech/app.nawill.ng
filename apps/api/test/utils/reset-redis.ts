import { RedisService } from '../../src/modules/redis/redis.service';

export async function resetRedis(redis: RedisService): Promise<void> {
  await redis.flushdb();
}
