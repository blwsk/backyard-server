import { client } from "../lib/db";

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

export const createEmailIngestAddressResolver = async ({
  userId,
  emailIngestAddress,
}: {
  userId: string;
  emailIngestAddress: string;
}) => {
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
