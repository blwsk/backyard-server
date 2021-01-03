import express from "express";
import { client } from "../db";

export const createClip = async (
  req: express.Request,
  res: express.Response
) => {
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
