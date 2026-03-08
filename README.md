# Gator RSS Feed Aggregator

Gator is a CLI tool written in TypeScript that collects RSS feeds and stores posts in a PostgreSQL database.
It allows users to follow feeds and browse the latest posts directly from the terminal.

---


## Requirements

To run this project you need:

* Node.js (v18 or newer)
* PostgreSQL
* npm
* nvm (optional)

### Use the correct Node version

```bash
nvm use 22.15.0
```

You can verify your Node version:

```bash
node --version
```

Example output:

```
v22.15.0
```

### Install dependencies

```bash
npm install
```

## Setup

### 1. Create the config file

Gator uses a JSON config file to store the current user.

Create the file:

```
~/.gatorconfig.json
```

Example content:

```
{
  "db_url": "postgres://username:password@localhost:5432/gator?sslmode=disable",
  "current_user_name": <userName>
}
```

Make sure PostgreSQL is running and the database exists.

---

### 2. Run the CLI

Run the program with:
 
```
npm run start <command>
```

Example:

```
npm run start register alice
```

---

## Commands

### Register a user

```
register <username>
```

Example:

```
register alice
```

---

### Login

```
login <username>
```

---

### Add a feed

```
addfeed <name> <url>
```

Example:

```
addfeed TechCrunch https://techcrunch.com/feed/
```

---

### Start the feed aggregator

```
agg <duration>
```

Example:

```
agg 10s
```

This will fetch RSS feeds every 10 seconds and store posts in the database.

---

### Browse posts

```
browse [limit]
```

Example:

```
browse
browse 10
```

If no limit is provided, the default is 2 posts.

---

## Example RSS Feeds

You can test the program with these feeds:

* https://techcrunch.com/feed/
* https://news.ycombinator.com/rss
* https://www.boot.dev/blog/index.xml

---

## Author
Eng.Raghad Moqady 

Built as part of the Boot.dev Backend Path.
