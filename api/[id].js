import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function getBaseUrl(req) {
  const host = req.headers.host;
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

function extractEncodedTree(stored) {
  if (!stored) return null;
  if (typeof stored !== "string") return String(stored);

  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    try {
      return new URL(stored).searchParams.get("t");
    } catch {
      return null;
    }
  }

  return stored;
}

export default async function handler(req, res) {
  const { id, format } = req.query;

  if (!id) {
    return res.status(400).send("Bad Request");
  }

  try {
    const stored = await redis.get(id);
    const encoded = extractEncodedTree(stored);

    if (!encoded) {
      return res.status(404).send("Not found");
    }

    if (format === "json") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.json({ t: encoded });
    }

    res.redirect(302, `${getBaseUrl(req)}/?load=${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}
