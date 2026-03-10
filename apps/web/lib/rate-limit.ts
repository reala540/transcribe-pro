import IORedis from "ioredis";

const memoryStore = new Map<string, { count: number; expiresAt: number }>();
let redis: IORedis | null = null;

function getRedisClient() {
  if (redis || !process.env.REDIS_URL) return redis;
  redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  redis.on("error", (error) => console.error("[rate-limit] Redis error, falling back to memory limiter", error));
  return redis;
}
function rateLimitInMemory(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const current = memoryStore.get(key);
  if (!current || current.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }
  current.count += 1;
  memoryStore.set(key, current);
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const client = getRedisClient();
  if (!client) return rateLimitInMemory(key, limit, windowSec);
  try {
    const redisKey = `ratelimit:${key}`;
    const current = await client.incr(redisKey);
    if (current === 1) await client.expire(redisKey, windowSec);
    return { allowed: current <= limit, remaining: Math.max(0, limit - current) };
  } catch (error) {
    console.error("[rate-limit] Falling back to memory limiter", error);
    return rateLimitInMemory(key, limit, windowSec);
  }
}
