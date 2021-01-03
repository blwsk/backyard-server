import express from "express";
import { client } from "../db";

const PG_MAX_INTEGER = 2147483647;

export const itemResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM items WHERE id = $1;
`;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const contentResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM content WHERE item_id = $1;
`;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const originResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM origins WHERE item_id = $1;
`;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const clipsForItemResolver = async (itemId: string) => {
  const queryString = `
      SELECT * FROM clips WHERE item_id = $1;
    `;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  return rows;
};

export const createItem = async (
  req: express.Request,
  res: express.Response
) => {
  const { url, createdAt, createdBy, source, content, origin } = req.body;

  const queryString = `
    INSERT INTO items (
        url, created_by, created_at, source
    ) VALUES (
        $1, $2, $3, $4
    ) RETURNING *;
    `;

  const values = [url, createdBy, new Date(createdAt), source];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  const generatedItemId = row.id;

  const createContentRecordMaybe = async () => {
    if (!content) {
      return null;
    }

    const {
      body = null,
      title = null,
      metaTitle = null,
      metaDescription = null,
      json = null,
    } = content;

    const { rows: contentRows } = await client.query(
      `
      INSERT INTO content (
        body, title, meta_title, meta_description, json, item_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING *;
      `,
      [body, title, metaTitle, metaDescription, json, generatedItemId]
    );

    return contentRows[0] || null;
  };

  const createOriginRecordMaybe = async () => {
    if (!origin) {
      return null;
    }

    const {
      emailBody = null,
      rssEntryContent = null,
      rssFeedUrl = null,
    } = origin;

    const { rows: originRows } = await client.query(
      `
      INSERT INTO origins (
        email_body, rss_entry_content, rss_feed_url, item_id
      ) VALUES (
        $1, $2, $3, $4
      ) RETURNING *;
      `,
      [emailBody, rssEntryContent, rssFeedUrl, generatedItemId]
    );

    return originRows[0] || null;
  };

  const contentMaybe = await createContentRecordMaybe();

  const originMaybe = await createOriginRecordMaybe();

  res.send({
    item: row,
    content: contentMaybe,
    origin: originMaybe,
  });
};

export const getItemById = async (
  req: express.Request,
  res: express.Response
) => {
  const { itemId } = req.params;

  const row = await itemResolver(itemId);

  if (!row) {
    res.status(404).end();
  }

  res.send(row);
};

export const getItemsPaginated = async (
  req: express.Request,
  res: express.Response
) => {
  const { size: sizeQp, cursor: cursorQp } = req.query;

  const queryString = `
      SELECT * FROM items WHERE id <= $1 ORDER BY id DESC LIMIT $2;
    `;

  const size = sizeQp ? parseInt(<string>sizeQp, 10) : 20;

  const parsedCursor = parseInt(<string>cursorQp, 10);
  const cursor = !isNaN(parsedCursor) ? parsedCursor : PG_MAX_INTEGER;

  const values = [cursor, size + 1];

  const { rows } = await client.query(queryString, values);

  const results = rows.slice(0, size);
  const nextRow = rows.length > size ? rows[rows.length - 1] : null;
  const next = nextRow ? nextRow.id : null;

  res.send({
    results,
    next,
  });
};

export const deleteItemById = async (
  req: express.Request,
  res: express.Response
) => {
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
};

export const getClipsForItem = async (
  req: express.Request,
  res: express.Response
) => {
  const { itemId } = req.params;

  const rows = await clipsForItemResolver(itemId);

  res.send(rows);
};
