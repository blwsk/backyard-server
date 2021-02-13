import express from "express";
import { client } from "../lib/db";
import { PG_MAX_INTEGER, SortOrder, isSortOrder } from "./lib/constants";

export const clipPageResolver = async ({
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
    throw new Error("clipPageResolver requires a userId argument");
  }
  if (!isSortOrder(sortOrder)) {
    throw new Error("clipPageResolver requires a sortOrder argument");
  }

  let queryString;
  switch (sortOrder) {
    case "ASC":
      queryString = `
      SELECT * FROM clips WHERE id <= $1 AND created_by = $2 ORDER BY id ASC LIMIT $3;
    `;
      break;

    case "DESC":
    default:
      queryString = `
      SELECT * FROM clips WHERE id <= $1 AND created_by = $2 ORDER BY id DESC LIMIT $3;
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

export const createClip = async (
  req: express.Request,
  res: express.Response
) => {
  const { text, createdBy, createdAt, itemId, legacyId } = req.body;

  const queryString = `
      INSERT INTO clips (
          text, created_by, created_at, item_id, legacy_id
      ) VALUES (
          $1, $2, $3, $4, $5
      ) RETURNING *;
    `;

  const values = [text, createdBy, new Date(createdAt), itemId, legacyId];

  let rows = [];

  try {
    const result = await client.query(queryString, values);

    rows = result.rows;
  } catch (e) {
    res.status(400).send({
      error: e.detail,
    });
  }

  const row = rows[0];
  res.send(row);
};

export const getClipById = async (
  req: express.Request,
  res: express.Response
) => {
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
};

export const deleteClipById = async (
  req: express.Request,
  res: express.Response
) => {
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
};
