import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

export const client = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
