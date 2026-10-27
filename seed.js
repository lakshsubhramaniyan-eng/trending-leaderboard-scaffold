// seed.js — load 100 fake posts into the leaderboard so you have data to rank.
// Run with:  npm run seed
//
// Each post needs BOTH:
//   - a hash  post:<id>:meta  with title + author
//   - a member in the sorted set trending:posts with a random starting score
//
// Use ONE pipeline for all the writes (200 commands, one round trip).

import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  const pipeline = redis.pipeline();
  for (let i = 1; i <= 100; i++) {
    const id = "post:" + i;
    const score = Math.floor(Math.random() * 50);
    pipeline.hset(id + ":meta", "title", "Post number " + i, "author", "@user" + i);
    pipeline.zadd("trending:posts", score, id);
  }

  const results = await pipeline.exec();
  if (results === null) {
    throw new Error("Redis seed pipeline did not return results");
  }
  const failedCommand = results.find(([error]) => error !== null);
  if (failedCommand) {
    throw failedCommand[0];
  }

  console.log("Seeded 100 posts.");
}

seed()
  .catch((error) => {
    console.error("Failed to seed leaderboard:", error);
    process.exitCode = 1;
  })
  .finally(() => redis.quit());
