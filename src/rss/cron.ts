import cron from "node-cron";
import fetch from "isomorphic-unfetch";
import dotenv from "dotenv";

import { getAccessToken } from "../lib/auth";
import { rss } from "./rss";
import { getRecentItems } from "./items";
import { makeLogger } from "../lib/logger";
import { allRssSubscriptionsResolver } from "../api/rss";
import { convertKeysToCamelCase } from "../lib/utils";

const logger = makeLogger("index");

dotenv.config();

const { BACKYARD_ROOT_URI } = process.env;

const makeSaveItemsForUser = ({ access_token }: { access_token: string }) => ({
  userId,
  itemsToSave,
  feedUrl,
}: {
  userId: string;
  itemsToSave: object[];
  feedUrl: string;
}) => {
  const params = [
    `userId=${userId}`,
    `feedUrl=${encodeURIComponent(feedUrl)}`,
  ].join("&");

  const uri = `${BACKYARD_ROOT_URI}/api/rss/bulk-save?${params}`;

  logger(`Saving items at ${uri.slice(0, 50)}`);

  return fetch(uri, {
    method: "POST",
    body: JSON.stringify(itemsToSave),
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => res.json());
};

export const setupCron = () => {
  return cron.schedule("0 * * * *", async () => {
    const { access_token } = await getAccessToken();

    if (!access_token) {
      throw new Error("Access token fetch failed. Cron job cannot continue.");
    }

    logger("Fetching rss subscriptions via resolver");

    const allRssSubscriptions = await allRssSubscriptionsResolver();

    const allRssSubscriptionsCamelCase = allRssSubscriptions.map(
      convertKeysToCamelCase
    );

    const json = allRssSubscriptionsCamelCase.map((item) => {
      const { feedUrl, userId } = item;

      return {
        feedUrl,
        userId,
      };
    });

    const feedManifests = await rss({ json });

    const recentItemFeeds = getRecentItems(feedManifests);

    const numRecentItems = recentItemFeeds.reduce((acc, { itemsToSave }) => {
      return (acc += itemsToSave.length);
    }, 0);

    /**
     * If no new items, do nothing
     */
    if (numRecentItems === 0) {
      logger("No recent items to save.");
      return;
    }

    /**
     * Otherwise, make requests to backyard-web for each
     */
    const saveItemsForUser = makeSaveItemsForUser({ access_token });

    const bulkSaveResult = await Promise.all(
      recentItemFeeds.map(({ userId, itemsToSave, feedUrl }) => {
        return saveItemsForUser({ userId, itemsToSave, feedUrl });
      })
    );

    void bulkSaveResult;

    logger(`Sent ${numRecentItems} items to backyard.wtf\n`);
  });
};
