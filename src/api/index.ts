import dotenv from "dotenv";
import express from "express";
import { client } from "../db";
import { auth } from "./lib/auth";

dotenv.config();

const { PORT } = process.env;

const app = express();

app.use(express.json());

app.use(auth);

/**
 * ITEMS
 */
app.post("/api/item", async (req, res) => {
  const { url, createdAt, createdBy, content, source, origin } = req.body;

  const queryString = `
      INSERT INTO items (
          url, created_by, created_at, content, source, origin
      ) VALUES (
          $1, $2, $3, $4, $5, $6
      ) RETURNING *;
    `;

  const values = [url, createdBy, new Date(createdAt), content, source, origin];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  res.send(row);
});

app.get("/api/item/:itemId", async (req, res) => {
  const { itemId } = req.params;

  const queryString = `
    SELECT * FROM items WHERE id = $1;
  `;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  if (!row) {
    res.status(404).end();
  }

  res.send(row);
});

app.delete("/api/item/:itemId", async (req, res) => {
  const { itemId } = req.params;

  const queryString = `
    DELETE FROM items WHERE id = $1 RETURNING *;
  `;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  if (!row) {
    res.status(404).end();
  }

  res.send({
    message: `Item ${itemId} and its clips have been deleted.`,
  });
});

app.get("/api/item/:itemId/clips", async (req, res) => {
  const { itemId } = req.params;

  const queryString = `
    SELECT * FROM clips WHERE item_id = $1;
  `;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  res.send(rows);
});

/**
 * CLIPS
 */
app.post("/api/clip", async (req, res) => {
  const { text, createdBy, createdAt, itemId } = req.body;

  const queryString = `
    INSERT INTO clips (
        text, created_by, created_at, item_id
    ) VALUES (
        $1, $2, $3, $4
    ) RETURNING *;
  `;

  const values = [text, createdBy, new Date(createdAt), itemId];

  let rows = [];
  let error;

  try {
    const result = await client.query(queryString, values);
    rows = result.rows;
  } catch (e) {
    error = e;
  }

  if (error) {
    res.status(400).send({
      error: error.detail,
    });
  }

  const row = rows[0];

  res.send(row);
});

app.get("/api/clip/:clipId", async (req, res) => {
  const { clipId } = req.params;

  const queryString = `
    SELECT * FROM clips WHERE id = $1;
  `;

  const values = [clipId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  if (!row) {
    res.status(404).end();
  }

  res.send(row);
});

app.delete("/api/clip/:clipId", async (req, res) => {
  const { clipId } = req.params;

  const queryString = `
    DELETE FROM clips WHERE id = $1 RETURNING *;
  `;

  const values = [clipId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  if (!row) {
    res.status(404).end();
  }

  res.send({
    message: `Clip ${clipId} has been deleted.`,
  });
});

export const listen = () => {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
  });
};
