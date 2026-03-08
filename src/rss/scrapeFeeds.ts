import { createPost } from "src/lib/db/queries/posts";
import { getNextFeedToFetch, markFeedFetched } from "../lib/db/queries/feeds";
import { fetchFeed } from "./fetchFeed";


export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();

  if (!feed) {
    console.log("No feeds found");
    return;
  }

  console.log(`Fetching feed: ${feed.name}`);

  await markFeedFetched(feed.id);

  const rssFeed = await fetchFeed(feed.url);

  for (const post of rssFeed.channel.item) {
   await createPost(
      post.title,
      post.link,
      post.description,
      new Date(post.pubDate),
      feed.id
);
  }
}