import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL);

redis.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[redis] connected");
});

// Cache key helpers so invalidation stays consistent everywhere it's used.
export const cacheKeys = {
  urlByCode: (code: string) => `url:${code}`,
  urlList: () => "url:list",
};

export const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
