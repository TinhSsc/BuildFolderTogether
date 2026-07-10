import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Bad Request");
  }

  try {
    const url = await redis.get(id);

    if (!url) {
      return res.status(404).send("Not found");
    }

    res.redirect(url);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}
