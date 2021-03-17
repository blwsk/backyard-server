import express from "express";
import { client } from "../lib/db";
import { convertKeysToCamelCase } from "../lib/utils";

export const allRssSubscriptionsResolver = async () => {
  const queryString = `
    SELECT * FROM rss_subscriptions;
  `;

  const { rows } = await client.query(queryString);

  return rows;
};

export const getAllRssSubscriptions = async (
  req: express.Request,
  res: express.Response
) => {
  const allRssSubscriptions = await allRssSubscriptionsResolver();

  res.status(200).send(allRssSubscriptions.map(convertKeysToCamelCase));
};
