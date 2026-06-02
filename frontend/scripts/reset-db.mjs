import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const envFile = readFileSync(path, "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(join(rootDir, ".env"));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const schema = readFileSync(join(rootDir, "db", "schema.sql"), "utf8");
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: "require",
});

try {
  await sql.unsafe(schema);
  console.log("Neon database reset complete.");
} finally {
  await sql.end();
}
