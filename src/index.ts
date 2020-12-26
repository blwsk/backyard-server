import cron from "node-cron";
import fetch from "isomorphic-unfetch";
import dotenv from "dotenv";

import { getAccessToken } from "./auth";
import { rss } from "./rss";
import { getRecentItems } from "./items";

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

  return fetch(uri, {
    method: "POST",
    body: JSON.stringify(itemsToSave),
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => res.json());
};

cron.schedule("* * * * *", async () => {
  const { access_token } = await getAccessToken();

  const { json, before, after, message } = await fetch(
    `${BACKYARD_ROOT_URI}/api/rss/poll-subs`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((r) => r.json());

  console.log(message);

  const feedManifests = await rss({ json, before, after });

  const recentItems = getRecentItems(feedManifests);

  /**
   * If no new items, do nothing
   */
  if (recentItems.length === 0) {
    console.log("\tNo recent items to save.");
    return;
  }

  /**
   * Otherwise, make requests to backyard-web for each
   */
  const saveItemsForUser = makeSaveItemsForUser({ access_token });

  const bulkSaveResult = await Promise.all(
    recentItems.map(({ userId, itemsToSave, feedUrl }) =>
      saveItemsForUser({ userId, itemsToSave, feedUrl })
    )
  );

  void bulkSaveResult;

  const num = recentItems.reduce((acc, { itemsToSave }) => {
    return (acc += itemsToSave.length);
  }, 0);

  console.log(`\tSent ${num} items to backyard.wtf`);
});
