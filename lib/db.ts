import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { profiles } from "./profiles";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "discover.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS swipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL UNIQUE,
    direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS incoming_likes (
    profile_id INTEGER PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS matches (
    profile_id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
const count = db.prepare("SELECT COUNT(*) AS n FROM incoming_likes").get() as { n: number };
if (count.n === 0) {
  // Demo-only incoming likes. They are never returned by /feed or /matches unless mutual.
  const seed = db.prepare("INSERT OR IGNORE INTO incoming_likes(profile_id) VALUES (?)");
  [2, 5, 9, 14, 18, 23, 27].forEach(id => seed.run(id));
}
export default db;
