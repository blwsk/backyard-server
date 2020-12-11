const express = require("express");
const cron = require("node-cron");
const fetch = require("isomorphic-unfetch");
const dotenv = require("dotenv");

const auth = require("./lib/auth");
const rss = require("./lib/rss");
const getRecentItems = require("./lib/items");

dotenv.config();

const { PORT, BACKYARD_ROOT_URI } = process.env;

const app = express();
const port = PORT;

app.get("/", async (req, res) => {
  res.send(`Hello from express!`);
});

const makeSaveItemsForUser = ({ access_token }) => ({
  userId,
  itemsToSave,
}) => {
  return fetch(`${BACKYARD_ROOT_URI}/api/rss/bulk-save?userId=${userId}`, {
    method: "POST",
    body: JSON.stringify(itemsToSave),
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => res.json());
};

cron.schedule("0 * * * *", async () => {
  const { access_token } = await auth();

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
    recentItems.map(({ userId, itemsToSave }) =>
      saveItemsForUser({ userId, itemsToSave })
    )
  );

  console.log(`\tSent ${bulkSaveResult.length} items to backyard.wtf`);
});

app.listen(port, () => {
  console.log(`App listening at ${port}`);
});
