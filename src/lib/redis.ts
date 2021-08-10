import redis from "redis";

const { REDIS_URL } = process.env;

export const client = redis.createClient({
  url: REDIS_URL,
});

client.on("error", (error) => {
  console.error(error);
});
