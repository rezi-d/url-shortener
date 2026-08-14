import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { redis, cacheKeys, CACHE_TTL_SECONDS } from "../lib/redis";
import { generateShortCode } from "../utils/shortcode";

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// POST /api/urls - create a short url
export async function createUrl(req: Request, res: Response) {
  const { originalUrl, customCode } = req.body as {
    originalUrl?: string;
    customCode?: string;
  };

  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.status(400).json({ error: "originalUrl tidak valid" });
  }

  let code = customCode?.trim();

  if (code) {
    const exists = await prisma.url.findUnique({ where: { code } });
    if (exists) {
      return res.status(409).json({ error: "custom code sudah dipakai" });
    }
  } else {
    // Retry on collision - astronomically unlikely with 7 chars, but be safe.
    do {
      code = generateShortCode();
    } while (await prisma.url.findUnique({ where: { code } }));
  }

  const url = await prisma.url.create({
    data: { code, originalUrl },
  });

  // New url isn't cached yet; invalidate the list cache so it shows up.
  await redis.del(cacheKeys.urlList());

  return res.status(201).json(url);
}

// GET /api/urls - list all urls with click counts
export async function listUrls(req: Request, res: Response) {
  const cached = await redis.get(cacheKeys.urlList());
  if (cached) {
    return res.json({ source: "cache", data: JSON.parse(cached) });
  }

  const urls = await prisma.url.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  await redis.set(
    cacheKeys.urlList(),
    JSON.stringify(urls),
    "EX",
    CACHE_TTL_SECONDS
  );

  return res.json({ source: "db", data: urls });
}

// GET /:code - redirect to original url, cached in Redis for fast lookups
export async function redirectByCode(req: Request, res: Response) {
  const { code } = req.params;
  const cacheKey = cacheKeys.urlByCode(code);

  const cachedUrl = await redis.get(cacheKey);
  let originalUrl: string;
  let urlId: string;

  if (cachedUrl) {
    // Cache hit: still need urlId for click logging.
    const url = await prisma.url.findUnique({ where: { code } });
    if (!url) {
      return res.status(404).json({ error: "short url tidak ditemukan" });
    }
    originalUrl = cachedUrl;
    urlId = url.id;
  } else {
    const url = await prisma.url.findUnique({ where: { code } });
    if (!url) {
      return res.status(404).json({ error: "short url tidak ditemukan" });
    }
    originalUrl = url.originalUrl;
    urlId = url.id;
    await redis.set(cacheKey, originalUrl, "EX", CACHE_TTL_SECONDS);
  }

  // Log the click for analytics (fire-and-forget style, but awaited for correctness).
  await prisma.click.create({
    data: {
      urlId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || undefined,
    },
  });

  return res.redirect(originalUrl);
}

// GET /api/urls/:code/analytics - click stats for one url
export async function getAnalytics(req: Request, res: Response) {
  const { code } = req.params;

  const url = await prisma.url.findUnique({
    where: { code },
    include: {
      clicks: { orderBy: { clickedAt: "desc" }, take: 50 },
      _count: { select: { clicks: true } },
    },
  });

  if (!url) {
    return res.status(404).json({ error: "short url tidak ditemukan" });
  }

  return res.json({
    code: url.code,
    originalUrl: url.originalUrl,
    createdAt: url.createdAt,
    totalClicks: url._count.clicks,
    recentClicks: url.clicks,
  });
}

// PUT /api/urls/:code - update destination, invalidate cache
export async function updateUrl(req: Request, res: Response) {
  const { code } = req.params;
  const { originalUrl } = req.body as { originalUrl?: string };

  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.status(400).json({ error: "originalUrl tidak valid" });
  }

  const existing = await prisma.url.findUnique({ where: { code } });
  if (!existing) {
    return res.status(404).json({ error: "short url tidak ditemukan" });
  }

  const updated = await prisma.url.update({
    where: { code },
    data: { originalUrl },
  });

  // Invalidate both the single-url cache and the list cache - this is the
  // cache invalidation the job posting asks about.
  await Promise.all([
    redis.del(cacheKeys.urlByCode(code)),
    redis.del(cacheKeys.urlList()),
  ]);

  return res.json(updated);
}

// DELETE /api/urls/:code - remove url, invalidate cache
export async function deleteUrl(req: Request, res: Response) {
  const { code } = req.params;

  const existing = await prisma.url.findUnique({ where: { code } });
  if (!existing) {
    return res.status(404).json({ error: "short url tidak ditemukan" });
  }

  await prisma.url.delete({ where: { code } });

  await Promise.all([
    redis.del(cacheKeys.urlByCode(code)),
    redis.del(cacheKeys.urlList()),
  ]);

  return res.status(204).send();
}
