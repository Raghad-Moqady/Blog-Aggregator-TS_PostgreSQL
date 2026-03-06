import { db } from "../index";
import { feeds, users } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string,url: string,userId: string) {
  const [feed] = await db .insert(feeds) .values({ name,url,userId}).returning();
  return feed;
}


export async function getFeeds() {
  const result = await db
    .select({
      feedName: feeds.name,
      feedUrl: feeds.url,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));

  return result;
}