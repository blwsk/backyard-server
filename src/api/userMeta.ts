import express from "express";
import { client } from "../lib/db";
import { convertKeysToCamelCase } from "../lib/utils";

export const userMetadataResolver = async (userId: string) => {
  const queryString = `
    SELECT * FROM user_metadata WHERE user_id = $1;
  `;

  const values = [userId];

  const { rows } = await client.query(queryString, values);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return row;
};

export const rssSubscriptionsForUserResolver = async (userId: string) => {
  const queryString = `
    SELECT * FROM rss_subscriptions WHERE created_by = $1;
  `;

  const values = [userId];

  const { rows } = await client.query(queryString, values);

  return rows;
};

export const createRssSubscriptionResolver = async ({
  userId,
  feedUrl,
}: {
  userId: string;
  feedUrl: string;
}) => {
  const queryString = `
    INSERT INTO rss_subscriptions (created_by, created_at, feed_url) VALUES ($1, $2, $3) RETURNING *;
  `;

  const values = [userId, new Date().toISOString(), feedUrl];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const deleteRssSubscriptionResolver = async ({
  userId,
  feedId,
}: {
  userId: string;
  feedId: string;
}) => {
  const queryString = `
    DELETE FROM rss_subscriptions WHERE id = $1 AND created_by = $2 RETURNING *;
  `;

  const values = [feedId, userId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const isEmailIngestAddressTaken = async (
  emailIngestAddress: string
): Promise<boolean> => {
  const {
    rows,
  } = await client.query(
    `SELECT email_ingest_address FROM user_metadata WHERE email_ingest_address = $1;`,
    [emailIngestAddress]
  );

  const isTaken = rows.length > 0;

  return isTaken;
};

export const createEmailIngestAddressResolver = async ({
  userId,
  emailIngestAddress,
}: {
  userId: string;
  emailIngestAddress: string;
}) => {
  const alreadyTaken = await isEmailIngestAddressTaken(emailIngestAddress);

  if (alreadyTaken) {
    throw new Error("Email ingest address is already taken");
  }

  const userMetadata = await userMetadataResolver(userId);

  if (userMetadata) {
    const queryString = `
      UPDATE user_metadata SET email_ingest_address = $1 WHERE user_id = $2 RETURNING *;
    `;

    const values = [emailIngestAddress, userId];

    const { rows } = await client.query(queryString, values);

    const row = rows[0];

    return row;
  }

  const queryString = `
    INSERT INTO user_metadata (user_id, email_ingest_address) VALUES ($1, $2) RETURNING *;
  `;

  const values = [userId, emailIngestAddress];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const deleteEmailIngestAddressResolver = async ({
  userId,
}: {
  userId: string;
}) => {
  const queryString = `
      UPDATE user_metadata SET email_ingest_address = $1 WHERE user_id = $2 RETURNING *;
    `;

  const nullEmailIngestAddress = null;
  const values = [nullEmailIngestAddress, userId];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const createPhoneNumberResolver = async ({
  userId,
  phoneNumber,
}: {
  userId: string;
  phoneNumber: string;
}) => {
  const userMetadata = await userMetadataResolver(userId);

  if (userMetadata) {
    const queryString = `
      UPDATE user_metadata SET phone_number = $1 WHERE user_id = $2 RETURNING *;
    `;

    const values = [phoneNumber, userId];

    const { rows } = await client.query(queryString, values);

    const row = rows[0];

    return row;
  }

  const queryString = `
    INSERT INTO user_metadata (user_id, phone_number) VALUES ($1, $2) RETURNING *;
  `;

  const values = [userId, phoneNumber];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const deletePhoneNumberResolver = async ({
  userId,
}: {
  userId: string;
}) => {
  const userMetadata = await userMetadataResolver(userId);

  const phoneNumber = null;

  if (userMetadata) {
    const queryString = `
      UPDATE user_metadata SET phone_number = $1 WHERE user_id = $2 RETURNING *;
    `;

    const values = [phoneNumber, userId];

    const { rows } = await client.query(queryString, values);

    const row = rows[0];

    return row;
  }

  const queryString = `
    INSERT INTO user_metadata (user_id, phone_number) VALUES ($1, $2) RETURNING *;
  `;

  const values = [userId, phoneNumber];

  const { rows } = await client.query(queryString, values);

  const row = rows[0];

  return row;
};

export const userMetadataByEmailIngestAddressResolver = async ({
  emailIngestAddress,
}: {
  emailIngestAddress?: string;
}) => {
  if (!emailIngestAddress) {
    throw new Error(
      "userMetadataByEmailIngestAddressResolver requires a emailIngestAddress arg"
    );
  }

  const queryString = `SELECT * FROM user_metadata WHERE email_ingest_address = $1;`;
  const values = [emailIngestAddress];

  const { rows } = await client.query(queryString, values);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

export const getUserMetadataByEmailIngestAddress = async (
  req: express.Request,
  res: express.Response
) => {
  const { emailIngestAddress } = req.query;

  const userMetadata = await userMetadataByEmailIngestAddressResolver({
    emailIngestAddress: emailIngestAddress as string,
  });

  if (!userMetadata) {
    res.status(404).send();
    return;
  }

  res.status(200).send(convertKeysToCamelCase(userMetadata));
};

export const userMetadataByPhoneNumberResolver = async ({
  phoneNumber,
}: {
  phoneNumber?: string;
}) => {
  if (!phoneNumber) {
    throw new Error(
      "userMetadataByPhoneNumberResolver requires a phoneNumber arg"
    );
  }

  const queryString = `SELECT * FROM user_metadata WHERE phone_number = $1;`;
  const values = [phoneNumber];

  const { rows } = await client.query(queryString, values);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

export const getUserMetadataByPhoneNumber = async (
  req: express.Request,
  res: express.Response
) => {
  const { phoneNumber } = req.query;

  const userMetadata = await userMetadataByPhoneNumberResolver({
    phoneNumber: phoneNumber as string,
  });

  if (!userMetadata) {
    res.status(404).send();
    return;
  }

  res.status(200).send(convertKeysToCamelCase(userMetadata));
};
