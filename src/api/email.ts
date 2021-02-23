import express from "express";
import { client } from "../lib/db";
import { makeLogger } from "../lib/logger";
import { convertKeysToCamelCase } from "../lib/utils";
import { createItemResolver } from "./item";
import { userMetadataByEmailIngestAddressResolver } from "./userMeta";

const log = makeLogger("api::email");

const generateBigInt = (): bigint => {
  return process.hrtime.bigint();
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
    envelope: string;
    // others???
  };

  let parsedEnvelope: { to: string[]; from: string };
  try {
    parsedEnvelope = JSON.parse(emailBody.envelope);
  } catch (error) {
    log(
      "receiveInboundEmail::errorParsingEnvelope",
      `envelope: ${emailBody.envelope}`
    );
    res.status(200).send();
    return;
  }

  const inboundEmailAddress = parsedEnvelope.to.find((toAddress) =>
    toAddress.indexOf("@save.backyard.wtf")
  );

  if (!inboundEmailAddress) {
    log(
      "receiveInboundEmail::noInboundEmailAddress",
      `envelope: ${emailBody.envelope}`
    );
    res.status(200).send();
    return;
  }

  const legacyId = generateBigInt();

  const userMetadataMaybe = await userMetadataByEmailIngestAddressResolver({
    emailIngestAddress: inboundEmailAddress,
  });

  if (!userMetadataMaybe) {
    log(
      "receiveInboundEmail::noUserDataForEmail",
      `emailIngestAddress: ${inboundEmailAddress}`
    );
    res.status(200).send();
    return;
  }

  const userMetadata = convertKeysToCamelCase(userMetadataMaybe);

  const item = await createItemResolver({
    createdBy: userMetadata.userId,
    createdAt: Date.now(),
    source: "email",
    legacyId,
    content: {
      json: emailBody,
    },
  });

  log("receiveInboundEmail::createItemFromEmail", JSON.stringify(item));

  res.status(200).send();
};
