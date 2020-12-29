import dotenv from "dotenv";
import express from "express";
import { client } from "../db";
import { auth } from "./lib/auth";

dotenv.config();

const { PORT } = process.env;

const app = express();

app.use(express.json());

app.use(auth);

app.post("/api/item", async (req, res) => {
  const { url, createdAt, createdBy, content, source, origin } = req.body;

  const text = `
      INSERT INTO items (
          url, created_by, created_at, content, source, origin
      ) VALUES (
          $1, $2, $3, $4, $5, $6
      ) RETURNING *;
    `;

  const values = [url, createdBy, new Date(createdAt), content, source, origin];

  const { rows } = await client.query(text, values);

  res.send(rows);
});

export const listen = () => {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
  });
};
