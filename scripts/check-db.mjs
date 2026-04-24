import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^DATABASE_URL=(.*)$/);
    if (m) {
      databaseUrl = m[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL missing (env or .env.local)");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  const { rows } = await client.query(
    "SELECT current_database() AS db, current_user AS user, inet_server_addr() AS server_addr"
  );
  console.log("OK: подключение к PostgreSQL есть.");
  console.log("  database:", rows[0].db);
  console.log("  user:", rows[0].user);
  if (rows[0].server_addr != null) {
    console.log("  server_addr:", rows[0].server_addr);
  }
  await client.end();
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
