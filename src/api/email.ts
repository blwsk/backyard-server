import express from "express";
import { client } from "../lib/db";
import { makeLogger } from "../lib/logger";
import { convertKeysToCamelCase } from "../lib/utils";
import { createItemResolver } from "./item";
import { userMetadataByEmailIngestAddressResolver } from "./userMeta";

const log = makeLogger("api::email");

const generateUuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const receiveInboundEmail = async (
  req: express.Request,
  res: express.Response
) => {
  /**
   * Store email body json in emails table
   */

  const jsonBody = req.body;

  const { rows } = await client.query(
    `
      INSERT INTO emails (
        json
      ) VALUES (
        $1
      ) RETURNING *;
      `,
    [jsonBody]
  );

  log("receiveInboundEmail::insertEmail", JSON.stringify(rows));

  if (rows.length === 0) {
    log("receiveInboundEmail::noContentReturn");
    return;
  }

  const emailBody = convertKeysToCamelCase(rows[0].json) as {
    to: string;
    from: string;
    // others???
  };

  const toEmailAddress = emailBody.to;

  const uuid = generateUuid();

  const createdBy = await userMetadataByEmailIngestAddressResolver({
    emailIngestAddress: toEmailAddress,
  });

  const item = await createItemResolver({
    createdBy,
    createdAt: Date.now(),
    source: "email",
    legacyId: uuid,
    content: {
      json: emailBody,
    },
  });

  log("receiveInboundEmail::createItemFromEmail", JSON.stringify(item));

  res.status(200).send();
};
