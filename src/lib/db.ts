import pg from "pg";

export const client = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
