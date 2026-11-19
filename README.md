# Coy Discover

A standalone, mobile-first swipe discovery experience inspired by Coy's visual language.

## Features

- Blank Home tab, Discover tab, and Matches view
- 32 seeded mock profiles
- Pointer/touch drag gestures and desktop Like / Pass controls
- One profile at a time; swiped profiles are excluded permanently
- Mutual-only matching and match celebration
- SQLite persistence across reloads and server restarts
- Incoming likes are seeded for demo purposes but never exposed in the feed or matches API

## Stack

Next.js 15 · React 19 · TypeScript · SQLite (`better-sqlite3`) · Lucide

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3001.

The SQLite database is created automatically at `data/discover.sqlite`. It is intentionally gitignored so each local installation starts with a fresh demo dataset.

## API

- `GET /feed` (also aliased at `/api/feed`) — profiles not yet swiped on
- `POST /swipe` (also aliased at `/api/swipe`) — body: `{ "profileId": 2, "direction": "like" }` or `"pass"`; returns `matched`
- `GET /matches` (also aliased at `/api/matches`) — mutual matches only

The requested endpoint names are available under `/api`. If deploying to a serverless platform, use a persistent database volume or replace SQLite with a hosted database; ephemeral serverless filesystems do not guarantee persistence.

## Demo matching

Incoming likes are seeded for profile IDs 2, 5, 9, 14, 18, 23, and 27. Like any of those profiles to trigger a mutual match. The app never returns incoming-like information to the client.

## Notes

- Profile photos use Unsplash image URLs and require an internet connection.
- This is a single-user demo with no external authentication.
- A swipe is stored with a unique profile ID, preventing duplicate swipes.


## Troubleshooting

Route handlers are implemented under `app/feed`, `app/swipe`, and `app/matches` so Next.js App Router registers the exact requested API paths. The UI also exits its loading state and displays a retry action if an API request fails.
