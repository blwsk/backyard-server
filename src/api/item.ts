import express from "express";
import DataLoader from "dataloader";
import format from "pg-format";
import { client } from "../lib/db";
import { PG_MAX_INTEGER, SortOrder, isSortOrder } from "./lib/constants";
import { makeLogger } from "../lib/logger";
import { convertKeysToCamelCase } from "../lib/utils";

const log = makeLogger("api::item");

export const itemResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM items WHERE id = $1;
`;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const legacyItemResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM items WHERE legacy_id = $1;
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

export const contentResolverBulk = async (itemIds: readonly string[]) => {
  const query = format("SELECT * FROM content WHERE item_id IN (%L);", itemIds);

  const { rows } = await client.query(query);

  const result = itemIds.map((itemId) => {
    const row = rows.find((r) => r.item_id === parseInt(itemId, 10));

    return row || null;
  });

  return result;
};

export const contentDataLoader = new DataLoader((keys: readonly string[]) =>
  contentResolverBulk(keys)
);

export const originResolver = async (itemId: string) => {
  const queryString = `
  SELECT * FROM origins WHERE item_id = $1;
`;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const originResolverBulk = async (itemIds: readonly string[]) => {
  const query = format("SELECT * FROM origins WHERE item_id IN (%L);", itemIds);

  const { rows } = await client.query(query);

  const result = itemIds.map((itemId) => {
    const row = rows.find((r) => r.item_id === parseInt(itemId, 10));

    return row || null;
  });

  return result;
};

export const originDataLoader = new DataLoader((keys: readonly string[]) =>
  originResolverBulk(keys)
);

export const clipsForItemResolver = async (itemId: string) => {
  const queryString = `
      SELECT * FROM clips WHERE item_id = $1;
    `;

  const values = [itemId];

  const { rows } = await client.query(queryString, values);

  return rows;
};

export const itemPageResolver = async ({
  size = 20,
  cursor = PG_MAX_INTEGER,
  userId,
  sortOrder,
}: {
  size?: number;
  cursor?: number;
  userId: string;
  sortOrder: SortOrder;
}): Promise<{ results: object[]; next?: number }> => {
  if (!userId) {
    throw new Error("itemPageResolver requires a userId argument");
  }
  if (!isSortOrder(sortOrder)) {
    throw new Error("itemPageResolver requires a sortOrder argument");
  }

  let queryString;
  switch (sortOrder) {
    case "ASC":
      queryString = `
      SELECT * FROM items WHERE id <= $1 AND created_by = $2 ORDER BY id ASC LIMIT $3;
    `;
      break;

    case "DESC":
    default:
      queryString = `
      SELECT * FROM items WHERE id <= $1 AND created_by = $2 ORDER BY id DESC LIMIT $3;
    `;
      break;
  }

  const values = [cursor, userId, size + 1];

  const { rows } = await client.query(queryString, values);

  const results = rows.slice(0, size);
  const nextRow = rows.length > size ? rows[rows.length - 1] : null;
  const next = nextRow ? nextRow.id : null;

  return {
    results,
    next,
  };
};

export const EMAIL = "email";
export const SMS = "sms";
export const MANUAL = "manual";
export const RSS = "rss";

export type Source = "email" | "sms" | "manual" | "rss";

export interface Content {
  body?: string;
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  json?: object;
}

export interface Origin {
  emailBody?: string;
  rssEntryContent?: string;
  rssFeedUrl?: string;
}

export interface Item {
  url?: string;
  createdBy: string;
  createdAt: number;
  content?: Content;
  source?: Source;
  origin?: Origin;
}

export interface ItemWithLegacyId extends Item {
  legacyId?: string;
}

export const createItemResolver = async ({
  url,
  createdBy,
  createdAt,
  source,
  legacyId,
  content,
  origin,
}: ItemWithLegacyId) => {
  const queryString = `
    INSERT INTO items (
        url, created_by, created_at, source, legacy_id
    ) VALUES (
        $1, $2, $3, $4, $5
    ) RETURNING *;
    `;

  const values = [url, createdBy, new Date(createdAt), source, legacyId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  const generatedItemId = row.id;

  const createContentRecord = async () => {
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

  const createOriginRecord = async () => {
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

  const contentRecord = await createContentRecord();

  const originRecord = await createOriginRecord();

  return {
    item: row,
    content: convertKeysToCamelCase(contentRecord),
    origin: convertKeysToCamelCase(originRecord),
  };
};

export const createItem = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    url,
    createdAt,
    createdBy,
    source,
    content,
    origin,
    legacyId,
  } = req.body;

  log("createItem", {
    url,
    createdAt,
    createdBy,
    source,
    content,
    origin,
    legacyId,
  });

  const itemRecord = await createItemResolver({
    url,
    createdAt,
    createdBy,
    source,
    content,
    origin,
    legacyId,
  });

  res.send(itemRecord);
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
  const {
    size: sizeQp,
    cursor: cursorQp,
    userId: userIdQp,
    sortOrderQp,
  } = req.query;

  const size = sizeQp ? parseInt(<string>sizeQp, 10) : 20;

  const parsedCursor = parseInt(<string>cursorQp, 10);
  const cursor = !isNaN(parsedCursor) ? parsedCursor : PG_MAX_INTEGER;

  const itemPage = await itemPageResolver({
    size,
    cursor,
    userId: userIdQp as string,
    sortOrder: sortOrderQp as SortOrder,
  });

  res.send(itemPage);
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

export const deleteItemsBulk = async (
  req: express.Request,
  res: express.Response
) => {
  const legacyItemIds = req.body;

  const query = format(
    "DELETE FROM items WHERE legacy_id IN (%L) RETURNING *;",
    legacyItemIds
  );

  const { rows } = await client.query(query);

  console.log(rows);

  res.send({
    message: `Items with the provided ids have been deleted.`,
    deletedLegacyItemIds: rows.map((row) => row.legacy_id),
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
