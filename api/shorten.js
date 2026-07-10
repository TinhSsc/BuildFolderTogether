import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const RATE_LIMIT = 3;
const RATE_WINDOW_SEC = 120;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded.length) return forwarded[0];
  return req.headers["x-real-ip"] || "unknown";
}

async function checkRateLimit(ip) {
  const key = `ratelimit:shorten:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, RATE_WINDOW_SEC);
  if (count > RATE_LIMIT) {
    const retryAfter = await redis.ttl(key);
    return { limited: true, retryAfter: retryAfter > 0 ? retryAfter : RATE_WINDOW_SEC };
  }
  return { limited: false };
}

function extractEncodedTree(body) {
  if (body.t) return body.t;
  if (body.url) {
    try {
      return new URL(body.url).searchParams.get("t");
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const encoded = extractEncodedTree(req.body || {});
    if (!encoded) {
      return res.status(400).json({ error: "Missing t parameter or url with ?t=" });
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(ip);
    if (rate.limited) {
      res.setHeader("Retry-After", String(rate.retryAfter));
      return res.status(429).json({
        error: "Rate limit exceeded. Max 3 shorten requests per 2 minutes.",
        retryAfter: rate.retryAfter,
      });
    }

    const id = Math.random().toString(36).slice(2, 8);
    await redis.set(id, encoded, { ex: 604800 });

    const host = req.headers.host;
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    res.json({ short: `${baseUrl}/api/${id}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
