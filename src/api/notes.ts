import { client } from "../lib/db";
import { PG_MAX_INTEGER, SortOrder, isSortOrder } from "./lib/constants";

export const notePageResolver = async ({
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
    throw new Error("notePageResolver requires a userId argument");
  }
  if (!isSortOrder(sortOrder)) {
    throw new Error("notePageResolver requires a sortOrder argument");
  }

  let queryString;
  switch (sortOrder) {
    case "ASC":
      queryString = `
      SELECT * FROM notes WHERE id <= $1 AND created_by = $2 ORDER BY id ASC LIMIT $3;
    `;
      break;

    case "DESC":
    default:
      queryString = `
      SELECT * FROM notes WHERE id <= $1 AND created_by = $2 ORDER BY id DESC LIMIT $3;
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

type NoteRow = {
  id: number;
  text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const createNoteResolver = async ({
  text,
  userId,
}: {
  text: string;
  userId: string;
}): Promise<NoteRow> => {
  const queryString = `
      INSERT INTO notes (
          text, created_by, created_at, updated_at
      ) VALUES (
          $1, $2, $3, $4
      ) RETURNING *;
    `;

  const now = new Date();

  const values = [text, userId, now, now];

  let rows = [];

  try {
    const result = await client.query(queryString, values);

    rows = result.rows;
  } catch (e) {
    throw e;
  }

  const row = rows[0];
  return row;
};

export const updateNoteResolver = async ({
  id,
  text,
  userId,
}: {
  id: number;
  text: string;
  userId: string;
}): Promise<NoteRow> => {
  const queryString = `
      UPDATE notes SET text = $1, updated_at = $2 WHERE id = $3 AND created_by = $4 RETURNING *;
    `;

  const now = new Date();

  const values = [text, now, id, userId];

  let rows = [];

  try {
    const result = await client.query(queryString, values);

    rows = result.rows;
  } catch (e) {
    throw e;
  }

  const row = rows[0];
  return row;
};

export const deleteNoteResolver = async ({
  id,
  userId,
}: {
  id: number;
  userId: string;
}) => {
  const query =
    "DELETE FROM notes WHERE id = $1 AND created_by = $2 RETURNING *;";

  const values = [id, userId];

  const { rows } = await client.query(query, values);

  return rows?.length ? id : null;
};
