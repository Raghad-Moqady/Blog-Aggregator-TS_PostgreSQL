import { XMLParser } from "fast-xml-parser";

export async function fetchFeed(feedURL: string) {

  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator"
    }
  });

  const xmlData = await response.text();

  const parser = new XMLParser();
  const data = parser.parse(xmlData);

  if (!data.rss || !data.rss.channel) {
    throw new Error("Invalid RSS feed: missing channel");
  }

  const channel = data.rss.channel;

  const title = channel.title;
  const link = channel.link;
  const description = channel.description;

  if (!title || !link || !description) {
    throw new Error("Invalid RSS feed metadata");
  }

  let items = [];

  if (channel.item) {
    if (Array.isArray(channel.item)) {
      items = channel.item;
    } else {
      items = [channel.item];
    }
  }

  const parsedItems = [];

  for (const item of items) {
    const { title, link, description, pubDate } = item;

    if (!title || !link || !description || !pubDate) {
      continue;
    }

    parsedItems.push({
      title,
      link,
      description,
      pubDate
    });
  }

  return {
    channel: {
      title,
      link,
      description,
      item: parsedItems
    }
  };
}