import postgres, { type Sql } from "postgres";

declare global {
  var eunoSql: Sql | undefined;
}

export function db() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis.eunoSql) {
    globalThis.eunoSql = postgres(databaseUrl, {
      max: 10,
      ssl: "require",
    });
  }

  return globalThis.eunoSql;
}
