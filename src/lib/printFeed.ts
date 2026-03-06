import { Feed } from "./db/schema";
import { User } from "./db/schema";

export function printFeed(feed: Feed, user: User) {
  console.log(`Feed: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User: ${user.name}`);
}