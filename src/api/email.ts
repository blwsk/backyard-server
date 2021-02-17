import express from "express";
import { client } from "../lib/db";

export const receiveInboundEmail = async (
  req: express.Request,
  res: express.Response
) => {
  const { rows } = await client.query(
    `
      INSERT INTO emails (
        json
      ) VALUES (
        $1
      ) RETURNING *;
      `,
    [req.body]
  );

  console.log(rows);

  res.status(200).send();
};
