import { setUser, readConfig } from "./config.js";
import { createFeed, getFeeds } from "./lib/db/queries/feeds.js";
import { createUser, getCurrentUser, getUserByname, getUsers, resetUsers } from "./lib/db/queries/users.js";
import { printFeed } from "./lib/printFeed.js";
import { fetchFeed } from "./rss/fetchFeed.js";
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;

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
async function handlerAgg(cmdName: string) {
  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(JSON.stringify(feed, null, 2));
}
 
async function handlerAddFeed(cmdName: string, ...args: string[]) {
  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }
  
  const name = args[0];
  const url = args[1];


  const user = await getCurrentUser();

  const feed = await createFeed(name, url, user.id);

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
  await registerCommand(registry, "addfeed", handlerAddFeed);
  await registerCommand(registry, "feeds", handlerShowFeeds);


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

