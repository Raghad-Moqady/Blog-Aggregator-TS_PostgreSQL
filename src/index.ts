import { setUser, readConfig } from "./config.js";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feedFollows.js";
import { createFeed, getFeedByUrl, getFeeds } from "./lib/db/queries/feeds.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";
import { createUser, getCurrentUser, getUserByname, getUsers, resetUsers } from "./lib/db/queries/users.js";
import { User } from "./lib/db/schema.js";
import { printFeed } from "./lib/printFeed.js";
import { fetchFeed } from "./rss/fetchFeed.js";
import { scrapeFeeds } from "./rss/scrapeFeeds.js";
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

async function handlerLogin(cmdName: string, ...args: string[]){
  if(args.length==0){
    console.error("Username is required");
    process.exit(1); 
  }
  if(!await getUserByname(args[0])){
    console.error("User does not exist");
    process.exit(1);  
  }
  setUser(args[0]);
  console.log(`User set to ${args[0]}`);
}

async function handlerRegister(cmdName: string,...args: string[]) {
  if (args.length === 0) {
    console.error("Username is required");
    process.exit(1);
  }

  const name = args[0];
  const user = await getUserByname(name);

  if (user) {
    console.error("User already exists");
    process.exit(1);   
  }
 
  const newUser = await createUser(name); 
  setUser(name);

  console.log("User created successfully!");
  console.log(newUser);
}
async function handlerReset(cmdName: string) {
  try {
    await resetUsers();
    console.log("Users table reset successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to reset users table:");
    process.exit(1); 
  }
}
async function handlerUsers(cmdName: string) {
  const allUsers = await getUsers();
  const config = readConfig();
  const current = config.currentUserName;

  allUsers.forEach(u => {
    const currentWord = u.name === current ? " (current)" : "";
    console.log(`* ${u.name}${currentWord}`);
  });
}
 
async function handlerAgg(cmdName: string, ...args: string[]) {
  const timeBetweenRequests = parseDuration(args[0]);

  console.log(`Collecting feeds every ${args[0]}`);

  const handleError = (err: Error) => {
    console.error(err);
  };

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}
 
async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }
  
  const name = args[0];
  const url = args[1];

 
  const feed = await createFeed(name, url, user.id);

  await createFeedFollow(user.id, feed.id);

  printFeed(feed, user);
}
async function handlerShowFeeds(cmdName: string, ...args: string[]) {

  if (args.length > 0) {
    console.error("feeds command takes no arguments");
    process.exit(1);
  }

  const feeds = await getFeeds();

  for (const feed of feeds) {
    console.log(`Name: ${feed.feedName}`);
    console.log(`URL: ${feed.feedUrl}`);
    console.log(`User: ${feed.userName}`);
    console.log("-------------");
  }
}
async function handlerFollow(cmdName: string, user: User, ...args: string[]){
  const url = args[0];

  const feed = await getFeedByUrl(url);

  if (!feed) {
    console.log("Feed not found");
    return;
  }

  const follow = await createFeedFollow(user.id, feed.id);

  console.log(`${follow.userName} is now following ${follow.feedName}`);
};
async function handlerFollowing(cmdName: string, user: User){
  const follows = await getFeedFollowsForUser(user.id);

  for (const follow of follows) {
    console.log(follow.feedName);
  }
};
async function handlerUnFollow(cmdName: string, user: User, ...args: string[]){
  const url = args[0];

  const feed = await getFeedByUrl(url);

  if (!feed) {
    console.log("Feed not found");
    return;
  }

  await deleteFeedFollow(user.id, feed.id);
  console.log(`Unfollowed ${feed.name}`);
};

async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
  const limit = args[0] ? parseInt(args[0]) : 2;

  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(`${post.title}`);
    console.log(`${post.url}`);
    console.log(`from: ${post.feedName}`);
    console.log("----");
  }
}
function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Invalid duration");
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60000;
    case "h":
      return value * 3600000;
    default:
      throw new Error("Invalid duration unit");
  }
}

async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler){
  registry[cmdName] = handler;
}
async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error("Unknown command");
  }

  await handler(cmdName, ...args);
}
function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    await handler(cmdName, user, ...args);
  };
}

async function main() {
  // setUser("Raghad");
  // const config = readConfig();
  // console.log(config);

  const registry: CommandsRegistry = {};

  await registerCommand(registry, "login", handlerLogin);
  await registerCommand(registry, "register", handlerRegister);
  await registerCommand(registry, "reset", handlerReset);
  await registerCommand(registry, "users", handlerUsers);
  await registerCommand(registry, "agg", handlerAgg);
  await registerCommand(registry, "addfeed",  middlewareLoggedIn(handlerAddFeed));
  await registerCommand(registry, "feeds", handlerShowFeeds);
  await registerCommand(registry, "follow",middlewareLoggedIn(handlerFollow));
  await registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  await registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnFollow));
  await registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Not enough arguments provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

}

await main();

