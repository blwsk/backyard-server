const express = require("express");
const cron = require("node-cron");
const fetch = require("isomorphic-unfetch");
const dotenv = require("dotenv");

dotenv.config();

const {
  PORT,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_TOKEN_URI,
  BACKYARD_ROOT_URI,
} = process.env;

const app = express();
const port = PORT;

const getAccessToken = async () => {
  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: AUTH0_AUDIENCE,
      grant_type: "client_credentials",
    }),
  };

  const response = await fetch(AUTH0_TOKEN_URI, options);

  const { access_token, token_type, expires_in } = await response.json();

  return { access_token, token_type, expires_in };
};

app.get("/", async (req, res) => {
  res.send(`Hello from express!`);
});

cron.schedule("0 * * * *", async () => {
  const { access_token } = await getAccessToken();

  const pollSubsResponse = await fetch(
    `${BACKYARD_ROOT_URI}/api/rss/poll-subs`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((r) => r.json());

  console.log(pollSubsResponse);
});

app.listen(port, () => {
  console.log(`App listening at ${port}`);
});
